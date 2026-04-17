import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    return this.generateTokens(user.id, user.email);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      return this.generateTokens(user.id, user.email);
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
        roles: {
          select: {
            role: true,
            empresaId: true,
            empresa: {
              select: { id: true, nome: true, slug: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return user;
  }

  async createUser(email: string, password: string, fullName?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        fullName,
      },
      select: { id: true, email: true, fullName: true },
    });

    return user;
  }

  async getUserRoles(userId: string) {
    const roles = await this.prisma.userRole.findMany({
      where: { userId },
      select: {
        role: true,
        empresaId: true,
      },
    });

    return roles.map((r) => ({
      role: r.role,
      empresaId: r.empresaId,
    }));
  }

  async getUserEmpresas(userId: string) {
    const roles = await this.prisma.userRole.findMany({
      where: { userId },
      select: {
        empresa: {
          select: { id: true, nome: true, slug: true, logoUrl: true },
        },
      },
    });

    const seen = new Set<string>();
    const empresas: any[] = [];
    for (const r of roles) {
      if (!seen.has(r.empresa.id)) {
        seen.add(r.empresa.id);
        empresas.push({
          id: r.empresa.id,
          nome: r.empresa.nome,
          slug: r.empresa.slug,
          logoUrl: r.empresa.logoUrl,
        });
      }
    }
    return empresas;
  }

  // ---- Registration ----

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ConflictException('Email já cadastrado');

    const slug = await this.generateSlug(dto.empresaSlug || dto.empresaNome);

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. User
      const user = await tx.user.create({
        data: { email, password: hashedPassword, fullName: dto.fullName },
      });

      // 2. Empresa
      const empresa = await tx.empresa.create({
        data: { nome: dto.empresaNome, slug },
      });

      // 3. Contador
      await tx.empresaContador.create({ data: { empresaId: empresa.id, ultimoNumero: 0 } });

      // 4. Admin role
      await tx.userRole.create({ data: { userId: user.id, role: 'admin', empresaId: empresa.id } });

      // 5. Perfil permissões padrão
      const defaultPerms = [
        { role: 'atendente' as const, telas: ['dashboard', 'pedidos', 'atendimento', 'fechamento', 'caixa', 'clientes', 'vendas', 'gestao-entregas', 'acerto-entregador'] },
        { role: 'garcom' as const, telas: ['atendimento', 'fechamento', 'cozinha', 'pedidos'] },
        { role: 'cozinha' as const, telas: ['cozinha'] },
      ];
      for (const { role, telas } of defaultPerms) {
        for (const telaKey of telas) {
          await tx.perfilPermissao.create({ data: { empresaId: empresa.id, role, telaKey } });
        }
      }

      // 6. Formas de pagamento padrão
      const formas = ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX'];
      for (const nome of formas) {
        await tx.formaPagamento.create({
          data: { empresaId: empresa.id, nome, exigeTroco: nome === 'Dinheiro' },
        });
      }

      // 7. Tipos de pedido padrão
      // origem: "ambos" aparece no cardápio online E no atendimento interno; "interno" só aparece no atendimento
      const tipos = [
        { tipoKey: 'retirada', label: 'Retirada', ordem: 0, origem: 'ambos', exigeEndereco: false, exigeMesa: false },
        { tipoKey: 'entrega', label: 'Entrega', ordem: 1, origem: 'ambos', exigeEndereco: true, exigeMesa: false },
        { tipoKey: 'mesa', label: 'Mesa', ordem: 2, origem: 'interno', exigeEndereco: false, exigeMesa: true },
      ];
      for (const tipo of tipos) {
        await tx.pedidoTipoConfig.create({ data: { empresaId: empresa.id, ...tipo } });
      }

      // 8. Status de pedido padrão (tiposAplicaveis define o fluxo kanban por tipo)
      const statuses = [
        { statusKey: 'novo', label: 'Novo', cor: 'blue', ordem: 0, tiposAplicaveis: ['retirada', 'entrega', 'mesa', 'comanda', 'ifood'] },
        { statusKey: 'confirmado', label: 'Confirmado', cor: 'yellow', ordem: 1, tiposAplicaveis: ['retirada', 'entrega', 'mesa', 'comanda', 'ifood'] },
        { statusKey: 'preparo', label: 'Em Preparo', cor: 'orange', ordem: 2, tiposAplicaveis: ['retirada', 'entrega', 'mesa', 'comanda', 'ifood'] },
        { statusKey: 'pronto', label: 'Pronto', cor: 'green', ordem: 3, tiposAplicaveis: ['retirada', 'entrega', 'mesa', 'comanda', 'ifood'] },
        { statusKey: 'saiu_entrega', label: 'Saiu p/ Entrega', cor: 'purple', ordem: 4, tiposAplicaveis: ['entrega', 'ifood'] },
        { statusKey: 'entregue', label: 'Entregue', cor: 'gray', ordem: 5, tiposAplicaveis: ['retirada', 'entrega', 'ifood'] },
      ];
      for (const s of statuses) {
        await tx.pedidoStatusConfig.create({ data: { empresaId: empresa.id, ...s } });
      }

      return { user, empresa };
    });

    const tokens = this.generateTokens(result.user.id, result.user.email);
    return {
      ...tokens,
      empresa: { id: result.empresa.id, nome: result.empresa.nome, slug: result.empresa.slug },
    };
  }

  private async generateSlug(input: string): Promise<string> {
    const base = input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 40);

    let slug = base;
    let attempt = 0;
    while (attempt < 5) {
      const exists = await this.prisma.empresa.findUnique({ where: { slug } });
      if (!exists) return slug;
      slug = `${base}-${Math.random().toString(36).substring(2, 6)}`;
      attempt++;
    }
    return `${base}-${Date.now().toString(36)}`;
  }

  private generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'dev-secret',
      expiresIn: 900, // 15 minutes
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
      expiresIn: 604800, // 7 days
    });

    return { accessToken, refreshToken };
  }
}
