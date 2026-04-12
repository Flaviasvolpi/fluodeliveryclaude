import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdicionaisService {
  constructor(private prisma: PrismaService) {}

  // --- Grupos ---
  findAllGrupos(empresaId: string) {
    return this.prisma.adicionaisGrupo.findMany({
      where: { empresaId },
      include: { itens: true },
      orderBy: { nome: 'asc' },
    });
  }

  createGrupo(empresaId: string, data: { nome: string; minSelect?: number; maxSelect?: number; ativo?: boolean }) {
    return this.prisma.adicionaisGrupo.create({ data: { ...data, empresaId } });
  }

  updateGrupo(id: string, empresaId: string, data: { nome?: string; minSelect?: number; maxSelect?: number; ativo?: boolean }) {
    return this.prisma.adicionaisGrupo.update({ where: { id, empresaId }, data });
  }

  deleteGrupo(id: string, empresaId: string) {
    return this.prisma.adicionaisGrupo.delete({ where: { id, empresaId } });
  }

  // --- Itens ---
  findItensByGrupo(grupoId: string, empresaId: string) {
    return this.prisma.adicionaisItem.findMany({
      where: { grupoId, empresaId },
      orderBy: { nome: 'asc' },
    });
  }

  createItem(empresaId: string, data: { grupoId: string; nome: string; preco?: number; ativo?: boolean }) {
    return this.prisma.adicionaisItem.create({ data: { ...data, empresaId } });
  }

  updateItem(id: string, empresaId: string, data: { nome?: string; preco?: number; ativo?: boolean }) {
    return this.prisma.adicionaisItem.update({ where: { id, empresaId }, data });
  }

  deleteItem(id: string, empresaId: string) {
    return this.prisma.adicionaisItem.delete({ where: { id, empresaId } });
  }
}
