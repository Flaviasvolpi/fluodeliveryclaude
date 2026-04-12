import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaDto, UpdateCategoriaDto } from './dto/create-categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(private prisma: PrismaService) {}

  findAll(empresaId: string) {
    return this.prisma.categoria.findMany({
      where: { empresaId },
      orderBy: { ordem: 'asc' },
    });
  }

  findAllActive(empresaId: string) {
    return this.prisma.categoria.findMany({
      where: { empresaId, ativo: true },
      orderBy: { ordem: 'asc' },
    });
  }

  create(empresaId: string, dto: CreateCategoriaDto) {
    return this.prisma.categoria.create({
      data: { ...dto, empresaId },
    });
  }

  update(id: string, empresaId: string, dto: UpdateCategoriaDto) {
    return this.prisma.categoria.update({
      where: { id, empresaId },
      data: dto,
    });
  }

  delete(id: string, empresaId: string) {
    return this.prisma.categoria.delete({ where: { id, empresaId } });
  }
}
