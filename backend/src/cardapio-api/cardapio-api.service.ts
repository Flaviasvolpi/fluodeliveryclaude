import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CardapioApiService {
  constructor(private prisma: PrismaService) {}

  async getCardapio(empresaId: string) {
    const categorias = await this.prisma.categoria.findMany({
      where: { empresaId, ativo: true },
      select: { id: true, nome: true, ordem: true },
      orderBy: { ordem: 'asc' },
    });

    const produtos = await this.prisma.produto.findMany({
      where: { empresaId, ativo: true },
      select: {
        id: true, nome: true, descricao: true, imagemUrl: true,
        categoriaId: true, precoBase: true, possuiVariantes: true, ordem: true,
      },
      orderBy: { ordem: 'asc' },
    });

    const variantes = await this.prisma.produtoVariante.findMany({
      where: { empresaId, ativo: true },
      select: { id: true, produtoId: true, nome: true, precoVenda: true, ordem: true },
      orderBy: { ordem: 'asc' },
    });

    const ingredientes = await this.prisma.produtoIngrediente.findMany({
      where: { empresaId, ativo: true },
      select: { id: true, produtoId: true, nome: true, removivel: true, ordem: true },
      orderBy: { ordem: 'asc' },
    });

    const prodGrupos = await this.prisma.produtoAdicionaisGrupo.findMany({
      where: { empresaId },
      select: { produtoId: true, grupoId: true },
    });

    const grupos = await this.prisma.adicionaisGrupo.findMany({
      where: { empresaId, ativo: true },
      select: { id: true, nome: true, minSelect: true, maxSelect: true },
    });

    const itensAdic = await this.prisma.adicionaisItem.findMany({
      where: { empresaId, ativo: true },
      select: { id: true, grupoId: true, nome: true, preco: true },
    });

    const formasPgto = await this.prisma.formaPagamento.findMany({
      where: { empresaId, ativo: true },
      select: { id: true, nome: true, exigeTroco: true },
    });

    const taxaRow = await this.prisma.configuracao.findFirst({
      where: { empresaId, chave: 'taxa_entrega_padrao' },
      select: { valor: true },
    });

    // Assemble grupos with itens
    const gruposMap = new Map(
      grupos.map((g) => [
        g.id,
        { ...g, itens: itensAdic.filter((i) => i.grupoId === g.id) },
      ]),
    );

    // Assemble produtos
    const produtosAssembled = produtos.map((p) => ({
      ...p,
      variantes: variantes.filter((v) => v.produtoId === p.id),
      ingredientes: ingredientes.filter((i) => i.produtoId === p.id),
      adicionais_grupos: prodGrupos
        .filter((pg) => pg.produtoId === p.id)
        .map((pg) => gruposMap.get(pg.grupoId))
        .filter(Boolean),
    }));

    // Assemble cardápio
    const cardapio = categorias.map((cat) => ({
      ...cat,
      produtos: produtosAssembled.filter((p) => p.categoriaId === cat.id),
    }));

    return {
      cardapio,
      formas_pagamento: formasPgto,
      taxa_entrega_padrao: taxaRow?.valor ? parseFloat(taxaRow.valor) : 0,
    };
  }

  async buscarProdutos(empresaId: string, q?: string, categoriaId?: string) {
    const where: any = { empresaId, ativo: true };
    if (categoriaId) where.categoriaId = categoriaId;
    if (q) where.nome = { contains: q, mode: 'insensitive' };

    return this.prisma.produto.findMany({
      where,
      include: {
        variantes: { where: { ativo: true }, orderBy: { ordem: 'asc' } },
        ingredientes: { where: { ativo: true }, orderBy: { ordem: 'asc' } },
        adicionaisGrupos: {
          include: { grupo: { include: { itens: { where: { ativo: true } } } } },
        },
      },
      orderBy: { ordem: 'asc' },
    });
  }
}
