import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  AbrirCaixaDto, FecharCaixaDto, CreateRecebimentoDto,
  CreateAcertoDto, AbrirEntregadorCaixaDto, CreateEntregadorRecebimentoDto,
} from './dto/caixa.dto';

@Injectable()
export class CaixaService {
  constructor(private prisma: PrismaService) {}

  // --- Sessões ---
  findAllSessoes(empresaId: string, status?: string) {
    const where: Prisma.CaixaSessaoWhereInput = { empresaId };
    if (status) where.status = status;
    return this.prisma.caixaSessao.findMany({
      where,
      orderBy: { abertoEm: 'desc' },
    });
  }

  abrirSessao(empresaId: string, dto: AbrirCaixaDto) {
    return this.prisma.caixaSessao.create({
      data: {
        empresaId,
        valorAbertura: dto.valorAbertura ?? 0,
        observacoes: dto.observacoes,
      },
    });
  }

  async fecharSessao(id: string, empresaId: string, dto: FecharCaixaDto) {
    const sessao = await this.prisma.caixaSessao.findFirst({
      where: { id, empresaId, status: 'aberto' },
    });
    if (!sessao) throw new NotFoundException('Sessão não encontrada ou já fechada');

    return this.prisma.caixaSessao.update({
      where: { id },
      data: {
        status: 'fechado',
        fechadoEm: new Date(),
        valorFechamento: dto.valorFechamento,
        observacoes: dto.observacoes ?? sessao.observacoes,
      },
    });
  }

  getSessaoDetail(id: string, empresaId: string) {
    return this.prisma.caixaSessao.findFirst({
      where: { id, empresaId },
      include: {
        recebimentos: {
          include: {
            formaPagamento: { select: { nome: true } },
            pedido: { select: { numeroSequencial: true } },
          },
        },
        motoboyAcertos: true,
        entregadorCaixas: {
          include: {
            entregador: { select: { nome: true } },
            recebimentos: true,
          },
        },
      },
    });
  }

  // --- Recebimentos ---
  createRecebimento(empresaId: string, dto: CreateRecebimentoDto) {
    return this.prisma.caixaRecebimento.create({
      data: {
        empresaId,
        caixaSessaoId: dto.caixaSessaoId || null,
        pedidoId: dto.pedidoId || null,
        contaId: dto.contaId || null,
        formaPagamentoId: dto.formaPagamentoId || null,
        valor: dto.valor,
        tipoOrigem: dto.tipoOrigem ?? 'pedido',
        motoboyUserId: dto.motoboyUserId || null,
      },
    });
  }

  findRecebimentos(empresaId: string, caixaSessaoId?: string) {
    const where: Prisma.CaixaRecebimentoWhereInput = { empresaId };
    if (caixaSessaoId) where.caixaSessaoId = caixaSessaoId;
    return this.prisma.caixaRecebimento.findMany({
      where,
      include: {
        formaPagamento: { select: { nome: true } },
        pedido: { select: { numeroSequencial: true, total: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- Motoboy Acertos ---
  createAcerto(empresaId: string, dto: CreateAcertoDto) {
    const diferenca = dto.totalColetado - dto.totalDevolvido;
    return this.prisma.motoboyAcerto.create({
      data: {
        empresaId,
        caixaSessaoId: dto.caixaSessaoId || null,
        motoboyUserId: dto.motoboyUserId,
        totalColetado: dto.totalColetado,
        totalDevolvido: dto.totalDevolvido,
        diferenca,
      },
    });
  }

  findAcertos(empresaId: string, caixaSessaoId?: string) {
    const where: Prisma.MotoboyAcertoWhereInput = { empresaId };
    if (caixaSessaoId) where.caixaSessaoId = caixaSessaoId;
    return this.prisma.motoboyAcerto.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- Entregador Caixa ---
  abrirEntregadorCaixa(empresaId: string, dto: AbrirEntregadorCaixaDto) {
    return this.prisma.entregadorCaixa.create({
      data: {
        empresaId,
        entregadorId: dto.entregadorId,
        caixaSessaoId: dto.caixaSessaoId || null,
        suprimento: dto.suprimento ?? 0,
      },
    });
  }

  async fecharEntregadorCaixa(id: string, empresaId: string) {
    return this.prisma.entregadorCaixa.update({
      where: { id, empresaId },
      data: { status: 'fechado', fechadoEm: new Date() },
    });
  }

  findEntregadorCaixas(empresaId: string, status?: string) {
    const where: Prisma.EntregadorCaixaWhereInput = { empresaId };
    if (status) where.status = status;
    return this.prisma.entregadorCaixa.findMany({
      where,
      include: {
        entregador: { select: { nome: true } },
        recebimentos: {
          include: { formaPagamento: { select: { nome: true } } },
        },
      },
      orderBy: { abertoEm: 'desc' },
    });
  }

  createEntregadorRecebimento(empresaId: string, dto: CreateEntregadorRecebimentoDto) {
    return this.prisma.entregadorRecebimento.create({
      data: {
        empresaId,
        entregadorCaixaId: dto.entregadorCaixaId,
        pedidoId: dto.pedidoId || null,
        formaPagamentoId: dto.formaPagamentoId || null,
        valor: dto.valor,
      },
    });
  }
}
