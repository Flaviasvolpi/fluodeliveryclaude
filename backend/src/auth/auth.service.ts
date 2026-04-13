import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

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
