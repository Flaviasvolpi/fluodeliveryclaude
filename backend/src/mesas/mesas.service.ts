import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMesaDto, UpdateMesaDto } from './dto/mesas.dto';

@Injectable()
export class MesasService {
  constructor(private prisma: PrismaService) {}

  findAll(empresaId: string) {
    return this.prisma.mesa.findMany({
      where: { empresaId },
      orderBy: { numero: 'asc' },
    });
  }

  create(empresaId: string, dto: CreateMesaDto) {
    return this.prisma.mesa.create({ data: { ...dto, empresaId } });
  }

  update(id: string, empresaId: string, dto: UpdateMesaDto) {
    return this.prisma.mesa.update({ where: { id, empresaId }, data: dto });
  }

  delete(id: string, empresaId: string) {
    return this.prisma.mesa.delete({ where: { id, empresaId } });
  }
}
