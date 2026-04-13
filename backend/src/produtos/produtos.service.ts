import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProdutoDto, UpdateProdutoDto } from './dto/create-produto.dto';

@Injectable()
export class ProdutosService {
  constructor(private prisma: PrismaService) {}

  findAll(empresaId: string) {
    return this.prisma.produto.findMany({
      where: { empresaId },
      include: {
        categoria: { select: { id: true, nome: true } },
        variantes: { orderBy: { ordem: 'asc' } },
        ingredientes: { orderBy: { ordem: 'asc' } },
        adicionaisGrupos: { include: { grupo: { include: { itens: true } } } },
      },
      orderBy: { ordem: 'asc' },
    });
  }

  findAllActive(empresaId: string) {
    return this.prisma.produto.findMany({
      where: { empresaId, ativo: true },
      include: {
        variantes: { where: { ativo: true }, orderBy: { ordem: 'asc' } },
        ingredientes: { where: { ativo: true }, orderBy: { ordem: 'asc' } },
        adicionaisGrupos: {
          include: {
            grupo: {
              include: { itens: { where: { ativo: true } } },
            },
          },
        },
      },
      orderBy: { ordem: 'asc' },
    });
  }

  findOne(id: string, empresaId: string) {
    return this.prisma.produto.findFirst({
      where: { id, empresaId },
      include: {
        variantes: { orderBy: { ordem: 'asc' } },
        ingredientes: { orderBy: { ordem: 'asc' } },
        adicionaisGrupos: { include: { grupo: { include: { itens: true } } } },
      },
    });
  }

  async create(empresaId: string, dto: CreateProdutoDto) {
    const { variantes, ingredientes, grupoIds, ...produtoData } = dto;

    return this.prisma.$transaction(async (tx) => {
      const produto = await tx.produto.create({
        data: { ...produtoData, empresaId },
      });

      if (variantes?.length) {
        await tx.produtoVariante.createMany({
          data: variantes.map((v) => ({ ...v, produtoId: produto.id, empresaId })),
        });
      }

      if (ingredientes?.length) {
        await tx.produtoIngrediente.createMany({
          data: ingredientes.map((i) => ({ ...i, produtoId: produto.id, empresaId })),
        });
      }

      if (grupoIds?.length) {
        await tx.produtoAdicionaisGrupo.createMany({
          data: grupoIds.map((grupoId) => ({ produtoId: produto.id, grupoId, empresaId })),
        });
      }

      return tx.produto.findUnique({
        where: { id: produto.id },
        include: {
          variantes: true,
          ingredientes: true,
          adicionaisGrupos: { include: { grupo: true } },
        },
      });
    });
  }

  async update(id: string, empresaId: string, dto: UpdateProdutoDto) {
    const { variantes, ingredientes, grupoIds, ...produtoData } = dto;

    return this.prisma.$transaction(async (tx) => {
      await tx.produto.update({
        where: { id, empresaId },
        data: produtoData,
      });

      if (variantes !== undefined) {
        await tx.produtoVariante.deleteMany({ where: { produtoId: id, empresaId } });
        if (variantes.length) {
          await tx.produtoVariante.createMany({
            data: variantes.map((v) => ({ ...v, produtoId: id, empresaId })),
          });
        }
      }

      if (ingredientes !== undefined) {
        await tx.produtoIngrediente.deleteMany({ where: { produtoId: id, empresaId } });
        if (ingredientes.length) {
          await tx.produtoIngrediente.createMany({
            data: ingredientes.map((i) => ({ ...i, produtoId: id, empresaId })),
          });
        }
      }

      if (grupoIds !== undefined) {
        await tx.produtoAdicionaisGrupo.deleteMany({ where: { produtoId: id, empresaId } });
        if (grupoIds.length) {
          await tx.produtoAdicionaisGrupo.createMany({
            data: grupoIds.map((grupoId) => ({ produtoId: id, grupoId, empresaId })),
          });
        }
      }

      return tx.produto.findUnique({
        where: { id },
        include: {
          variantes: true,
          ingredientes: true,
          adicionaisGrupos: { include: { grupo: true } },
        },
      });
    });
  }

  async toggleAtivo(id: string, empresaId: string, ativo: boolean) {
    return this.prisma.produto.update({
      where: { id, empresaId },
      data: { ativo },
    });
  }

  delete(id: string, empresaId: string) {
    return this.prisma.produto.delete({ where: { id, empresaId } });
  }
}
