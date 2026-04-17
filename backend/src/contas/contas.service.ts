import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ContasService {
  constructor(private prisma: PrismaService) {}

  findAll(empresaId: string, status?: string) {
    const where: Prisma.ContaWhereInput = { empresaId };
    if (status) where.status = status;
    return this.prisma.conta.findMany({
      where,
      include: {
        mesa: { select: { numero: true, nome: true } },
        pagamentos: { include: { formaPagamento: { select: { nome: true } } } },
        pedidos: { select: { id: true, numeroSequencial: true, total: true, pedidoStatus: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, empresaId: string) {
    const conta = await this.prisma.conta.findFirst({
      where: { id, empresaId },
      include: {
        mesa: true,
        pagamentos: { include: { formaPagamento: true } },
        pedidos: {
          include: { itens: { include: { adicionais: true } }, formaPagamento: true },
        },
      },
    });
    if (!conta) throw new NotFoundException('Conta não encontrada');
    return conta;
  }

  async addPagamento(empresaId: string, data: { contaId: string; formaPagamentoId?: string; valor: number; pessoaLabel?: string }) {
    return this.prisma.contaPagamento.create({
      data: {
        empresaId,
        contaId: data.contaId,
        formaPagamentoId: data.formaPagamentoId || null,
        valor: data.valor,
        pessoaLabel: data.pessoaLabel,
      },
    });
  }

  async fecharConta(id: string, empresaId: string, opts?: { incluirTaxaServico?: boolean }) {
    const conta = await this.prisma.conta.findFirst({
      where: { id, empresaId, status: 'aberta' },
      include: { pagamentos: true },
    });
    if (!conta) throw new NotFoundException('Conta não encontrada ou já fechada');

    // Se cliente recusou a taxa de serviço, zera em todos os pedidos da conta e recalcula o total
    if (opts?.incluirTaxaServico === false) {
      const pedidos = await this.prisma.pedido.findMany({ where: { contaId: id, empresaId } });
      let totalDiff = new Prisma.Decimal(0);
      for (const p of pedidos) {
        const taxa = new Prisma.Decimal(p.taxaServico);
        if (taxa.gt(0)) {
          totalDiff = totalDiff.plus(taxa);
          await this.prisma.pedido.update({
            where: { id: p.id },
            data: {
              taxaServico: new Prisma.Decimal(0),
              total: new Prisma.Decimal(p.total).minus(taxa),
            },
          });
        }
      }
      if (totalDiff.gt(0)) {
        await this.prisma.conta.update({
          where: { id },
          data: { total: new Prisma.Decimal(conta.total).minus(totalDiff) },
        });
        conta.total = new Prisma.Decimal(conta.total).minus(totalDiff);
      }
    }

    const totalPago = conta.pagamentos.reduce(
      (sum, p) => sum.plus(p.valor),
      new Prisma.Decimal(0),
    );

    if (totalPago.lt(conta.total)) {
      throw new BadRequestException(
        `Pagamento insuficiente. Total: ${conta.total}, Pago: ${totalPago}`,
      );
    }

    return this.prisma.conta.update({
      where: { id },
      data: { status: 'fechada', fechadaEm: new Date() },
    });
  }
}
