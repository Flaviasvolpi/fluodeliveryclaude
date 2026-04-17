import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreatePedidoDto, UpdatePedidoDto, QueryPedidosDto } from './dto/pedidos.dto';

@Injectable()
export class PedidosService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Creates an order using an interactive Prisma transaction.
   * Replicates the logic from the Supabase criar_pedido() RPC function:
   * 1. Upsert cliente by (empresa_id, telefone)
   * 2. Validate and apply cupom
   * 3. Auto-manage contas for mesa/comanda
   * 4. Increment empresa_contadores atomically
   * 5. Insert pedido + itens + adicionais
   * 6. Check fidelidade rules and generate coupons
   */
  async criarPedido(empresaId: string, dto: CreatePedidoDto): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      let clienteId: string | null = null;
      let cupomId: string | null = null;
      let desconto = new Prisma.Decimal(0);
      let contaId: string | null = null;

      const subtotal = new Prisma.Decimal(dto.subtotal);
      const taxaEntrega = new Prisma.Decimal(dto.taxaEntrega ?? 0);
      const taxaServico = new Prisma.Decimal(dto.taxaServico ?? 0);

      // 1. Upsert cliente if telefone provided
      if (dto.clienteTelefone) {
        const cliente = await tx.cliente.upsert({
          where: {
            empresaId_telefone: {
              empresaId,
              telefone: dto.clienteTelefone,
            },
          },
          update: { nome: dto.clienteNome, updatedAt: new Date() },
          create: {
            empresaId,
            telefone: dto.clienteTelefone,
            nome: dto.clienteNome,
          },
        });
        clienteId = cliente.id;
      }

      // 2. Validate and apply cupom
      if (dto.cupomCodigo) {
        const cupom = await tx.cupom.findUnique({
          where: {
            empresaId_codigo: {
              empresaId,
              codigo: dto.cupomCodigo,
            },
          },
        });

        if (!cupom || !cupom.ativo || cupom.usoAtual >= cupom.usoMaximo) {
          throw new BadRequestException('Cupom inválido ou expirado');
        }

        if (cupom.validoAte && cupom.validoAte < new Date()) {
          throw new BadRequestException('Cupom expirado');
        }

        if (cupom.clienteId && cupom.clienteId !== clienteId) {
          throw new BadRequestException('Este cupom não pertence a este cliente');
        }

        if (subtotal.lt(cupom.valorMinimo)) {
          throw new BadRequestException('Valor mínimo do pedido não atingido para este cupom');
        }

        // Calculate discount
        if (cupom.tipoDesconto === 'percentual') {
          desconto = subtotal.mul(cupom.valorDesconto).div(100).toDecimalPlaces(2);
        } else {
          desconto = cupom.valorDesconto;
        }

        // Discount can't exceed subtotal
        if (desconto.gt(subtotal)) {
          desconto = subtotal;
        }

        cupomId = cupom.id;

        // Increment usage
        await tx.cupom.update({
          where: { id: cupomId },
          data: { usoAtual: { increment: 1 } },
        });
      }

      const total = subtotal.minus(desconto).plus(taxaEntrega).plus(taxaServico);

      // 3. Auto-manage conta for mesa/comanda types
      if (dto.mesaId) {
        const existingConta = await tx.conta.findFirst({
          where: { empresaId, mesaId: dto.mesaId, status: 'aberta' },
        });

        if (existingConta) {
          contaId = existingConta.id;
          await tx.conta.update({
            where: { id: contaId },
            data: { total: { increment: total } },
          });
        } else {
          const newConta = await tx.conta.create({
            data: { empresaId, mesaId: dto.mesaId, tipo: 'mesa', total },
          });
          contaId = newConta.id;
        }
      } else if (dto.referencia && dto.tipo === 'comanda') {
        const existingConta = await tx.conta.findFirst({
          where: {
            empresaId,
            referencia: dto.referencia,
            tipo: 'comanda',
            status: 'aberta',
          },
        });

        if (existingConta) {
          contaId = existingConta.id;
          await tx.conta.update({
            where: { id: contaId },
            data: { total: { increment: total } },
          });
        } else {
          const newConta = await tx.conta.create({
            data: {
              empresaId,
              tipo: 'comanda',
              referencia: dto.referencia,
              total,
            },
          });
          contaId = newConta.id;
        }
      }

      // 4. Increment empresa_contadores atomically
      let numero: number;
      try {
        const counter = await tx.empresaContador.update({
          where: { empresaId },
          data: { ultimoNumero: { increment: 1 } },
        });
        numero = counter.ultimoNumero;
      } catch {
        // Auto-create counter if missing
        const counter = await tx.empresaContador.upsert({
          where: { empresaId },
          update: { ultimoNumero: { increment: 1 } },
          create: { empresaId, ultimoNumero: 1 },
        });
        numero = counter.ultimoNumero;
      }

      // 5. Insert pedido
      const pedido = await tx.pedido.create({
        data: {
          empresaId,
          numeroSequencial: numero,
          clienteNome: dto.clienteNome,
          clienteTelefone: dto.clienteTelefone,
          clienteId,
          tipo: dto.tipo,
          endereco: dto.endereco ?? Prisma.JsonNull,
          subtotal,
          taxaEntrega,
          taxaServico,
          desconto,
          total,
          formaPagamentoId: dto.formaPagamentoId || null,
          observacoes: dto.observacoes,
          mesaId: dto.mesaId || null,
          garcomUserId: dto.garcomUserId || null,
          referencia: dto.referencia || null,
          contaId,
          pagarNaEntrega: dto.pagarNaEntrega ?? false,
          cupomId,
        },
      });

      // Insert itens + adicionais
      for (const item of dto.itens) {
        const pedidoItem = await tx.pedidoItem.create({
          data: {
            empresaId,
            pedidoId: pedido.id,
            produtoId: item.produtoId || null,
            produtoVarianteId: item.produtoVarianteId || null,
            nomeSnapshot: item.nomeSnapshot,
            varianteNomeSnapshot: item.varianteNomeSnapshot,
            precoUnitSnapshot: item.precoUnitSnapshot,
            custoUnitSnapshot: item.custoUnitSnapshot ?? 0,
            qtd: item.qtd,
            observacaoItem: item.observacaoItem,
          },
        });

        if (item.adicionais?.length) {
          await tx.pedidoItemAdicional.createMany({
            data: item.adicionais.map((a) => ({
              empresaId,
              pedidoItemId: pedidoItem.id,
              adicionalItemId: a.adicionalItemId || null,
              nomeSnapshot: a.nomeSnapshot,
              precoSnapshot: a.precoSnapshot,
              qtd: a.qtd ?? 1,
            })),
          });
        }
      }

      // 6. Fidelidade: auto-generate coupon if threshold met
      if (clienteId) {
        const totalPedidosCliente = await tx.pedido.count({
          where: { empresaId, clienteId },
        });

        const cliente = await tx.cliente.findUnique({
          where: { id: clienteId },
          select: { ultimoCupomPedidos: true },
        });

        const ultimoCupomPedidos = cliente?.ultimoCupomPedidos ?? 0;

        const regras = await tx.fidelidadeRegra.findMany({
          where: { empresaId, ativo: true },
        });

        for (const regra of regras) {
          if (
            regra.metaPedidos > 0 &&
            totalPedidosCliente >= ultimoCupomPedidos + regra.metaPedidos
          ) {
            const cupomCode =
              'FIEL-' +
              crypto.randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase();

            await tx.cupom.create({
              data: {
                empresaId,
                regraId: regra.id,
                clienteId,
                codigo: cupomCode,
                tipoDesconto: regra.tipoRecompensa,
                valorDesconto: regra.valorRecompensa,
                usoMaximo: 1,
                validoAte:
                  regra.validadeDias > 0
                    ? new Date(
                        Date.now() + regra.validadeDias * 24 * 60 * 60 * 1000,
                      )
                    : null,
              },
            });

            await tx.cliente.update({
              where: { id: clienteId },
              data: { ultimoCupomPedidos: totalPedidosCliente },
            });
          }
        }
      }

      return numero;
    });
  }

  async findAll(empresaId: string, query: QueryPedidosDto) {
    const where: Prisma.PedidoWhereInput = { empresaId };

    if (query.status) where.pedidoStatus = query.status;
    if (query.tipo) where.tipo = query.tipo;
    if (query.clienteTelefone) where.clienteTelefone = { contains: query.clienteTelefone };

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo + 'T23:59:59Z');
    }

    return this.prisma.pedido.findMany({
      where,
      include: {
        itens: {
          include: { adicionais: true },
        },
        formaPagamento: { select: { nome: true } },
        entregador: { select: { nome: true } },
        mesa: { select: { numero: true, nome: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, empresaId: string) {
    const pedido = await this.prisma.pedido.findFirst({
      where: { id, empresaId },
      include: {
        itens: { include: { adicionais: true } },
        formaPagamento: true,
        entregador: true,
        mesa: true,
        conta: true,
        cliente: true,
        cupom: true,
      },
    });
    if (!pedido) throw new NotFoundException('Pedido não encontrado');
    return pedido;
  }

  async updateStatus(id: string, empresaId: string, pedidoStatus: string) {
    const pedido = await this.prisma.pedido.update({
      where: { id, empresaId },
      data: { pedidoStatus },
    });

    // Emit event for iFood status sync
    this.eventEmitter.emit('pedido.status.changed', {
      empresaId,
      pedidoId: pedido.id,
      ifoodOrderId: pedido.ifoodOrderId,
      newStatus: pedidoStatus,
    });

    return pedido;
  }

  async update(id: string, empresaId: string, dto: UpdatePedidoDto) {
    const data: Prisma.PedidoUpdateInput = {};
    if (dto.pedidoStatus) data.pedidoStatus = dto.pedidoStatus;
    if (dto.pagamentoStatus) data.pagamentoStatus = dto.pagamentoStatus as any;
    if (dto.entregadorId) data.entregador = { connect: { id: dto.entregadorId } };
    if (dto.observacoes !== undefined) data.observacoes = dto.observacoes;

    return this.prisma.pedido.update({
      where: { id, empresaId },
      data,
    });
  }
}
