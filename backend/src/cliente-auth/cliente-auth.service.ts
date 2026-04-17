import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

// In-memory rate limiting (resets on restart)
const attempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, max = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

function hashPin(pin: string, salt: string): string {
  return createHash('sha256').update(salt + pin).digest('hex');
}

@Injectable()
export class ClienteAuthService {
  constructor(private prisma: PrismaService) {}

  async verificarTelefone(empresaId: string, telefone: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { empresaId_telefone: { empresaId, telefone } },
      select: { id: true, pinHash: true },
    });

    if (!cliente) return { existe: false, tem_conta: false };
    return { existe: true, tem_conta: !!cliente.pinHash };
  }

  async verificarPin(empresaId: string, telefone: string, pin: string) {
    if (!checkRateLimit(`${empresaId}:${telefone}`)) {
      throw new HttpException('Muitas tentativas. Aguarde 1 minuto.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const cliente = await this.prisma.cliente.findUnique({
      where: { empresaId_telefone: { empresaId, telefone } },
      select: { id: true, nome: true, pinHash: true },
    });

    if (!cliente || !cliente.pinHash) {
      return { error: 'Cliente não encontrado ou sem cadastro', fallback: true };
    }

    const hashed = hashPin(pin, empresaId);
    if (hashed !== cliente.pinHash) {
      return { error: 'PIN incorreto' };
    }

    return { cliente_id: cliente.id, nome: cliente.nome, telefone };
  }

  async cadastrar(empresaId: string, telefone: string, nome: string, pin: string) {
    const pinHash = hashPin(pin, empresaId);

    const cliente = await this.prisma.cliente.upsert({
      where: { empresaId_telefone: { empresaId, telefone } },
      update: { nome, pinHash },
      create: { empresaId, telefone, nome, pinHash },
      select: { id: true },
    });

    return { cliente_id: cliente.id, nome, telefone };
  }

  async meusPedidos(clienteId: string, empresaId: string) {
    const pedidos = await this.prisma.pedido.findMany({
      where: { empresaId, clienteId },
      select: {
        id: true, numeroSequencial: true, createdAt: true,
        total: true, pedidoStatus: true, tipo: true,
        itens: {
          select: {
            produtoId: true, produtoVarianteId: true,
            nomeSnapshot: true, qtd: true,
            precoUnitSnapshot: true, custoUnitSnapshot: true,
            varianteNomeSnapshot: true, observacaoItem: true,
            adicionais: {
              select: {
                adicionalItemId: true,
                nomeSnapshot: true, precoSnapshot: true, qtd: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return { pedidos };
  }

  async meusCupons(clienteId: string, empresaId: string) {
    const now = new Date();
    const cupons = await this.prisma.cupom.findMany({
      where: {
        empresaId,
        clienteId,
        ativo: true,
      },
      select: {
        id: true, codigo: true, tipoDesconto: true,
        valorDesconto: true, valorMinimo: true,
        validoAte: true, usoAtual: true, usoMaximo: true,
      },
    });

    const ativos = cupons.filter(
      (c) => c.usoAtual < c.usoMaximo && (!c.validoAte || c.validoAte > now),
    );

    return { cupons: ativos };
  }

  async meusEnderecos(
    clienteId: string,
    empresaId: string,
    action: string = 'listar',
    endereco?: any,
  ) {
    if (!action || action === 'listar') {
      const enderecos = await this.prisma.clienteEndereco.findMany({
        where: { clienteId, empresaId },
        orderBy: { padrao: 'desc' },
      });
      return { enderecos };
    }

    if (action === 'salvar') {
      if (!endereco?.rua || !endereco?.numero || !endereco?.bairro) {
        throw new BadRequestException('Endereço incompleto');
      }

      if (endereco.padrao) {
        await this.prisma.clienteEndereco.updateMany({
          where: { clienteId, empresaId },
          data: { padrao: false },
        });
      }

      const cepLimpo = endereco.cep ? String(endereco.cep).replace(/\D/g, '') : null;
      const cepNormalizado = cepLimpo && cepLimpo.length === 8 ? cepLimpo : null;

      if (endereco.id) {
        await this.prisma.clienteEndereco.update({
          where: { id: endereco.id },
          data: {
            apelido: endereco.apelido || 'Casa',
            cep: cepNormalizado,
            rua: endereco.rua,
            numero: endereco.numero,
            bairro: endereco.bairro,
            complemento: endereco.complemento || null,
            referencia: endereco.referencia || null,
            padrao: endereco.padrao || false,
          },
        });
      } else {
        await this.prisma.clienteEndereco.create({
          data: {
            empresaId,
            clienteId,
            apelido: endereco.apelido || 'Casa',
            cep: cepNormalizado,
            rua: endereco.rua,
            numero: endereco.numero,
            bairro: endereco.bairro,
            complemento: endereco.complemento || null,
            referencia: endereco.referencia || null,
            padrao: endereco.padrao || false,
          },
        });
      }

      return { ok: true };
    }

    if (action === 'excluir') {
      if (!endereco?.id) throw new BadRequestException('id do endereço obrigatório');
      await this.prisma.clienteEndereco.delete({ where: { id: endereco.id } });
      return { ok: true };
    }

    throw new BadRequestException('Ação inválida');
  }
}
