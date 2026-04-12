import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntregadorDto, UpdateEntregadorDto } from './dto/entregadores.dto';

@Injectable()
export class EntregadoresService {
  constructor(private prisma: PrismaService) {}

  findAll(empresaId: string) {
    return this.prisma.entregador.findMany({
      where: { empresaId },
      orderBy: { nome: 'asc' },
    });
  }

  create(empresaId: string, dto: CreateEntregadorDto) {
    return this.prisma.entregador.create({ data: { ...dto, empresaId } });
  }

  update(id: string, empresaId: string, dto: UpdateEntregadorDto) {
    return this.prisma.entregador.update({ where: { id, empresaId }, data: dto });
  }

  delete(id: string, empresaId: string) {
    return this.prisma.entregador.delete({ where: { id, empresaId } });
  }
}
