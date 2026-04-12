import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFidelidadeRegraDto, UpdateFidelidadeRegraDto } from './dto/fidelidade.dto';

@Injectable()
export class FidelidadeService {
  constructor(private prisma: PrismaService) {}

  findAll(empresaId: string) {
    return this.prisma.fidelidadeRegra.findMany({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(empresaId: string, dto: CreateFidelidadeRegraDto) {
    return this.prisma.fidelidadeRegra.create({ data: { ...dto, empresaId } });
  }

  update(id: string, empresaId: string, dto: UpdateFidelidadeRegraDto) {
    return this.prisma.fidelidadeRegra.update({ where: { id, empresaId }, data: dto });
  }

  delete(id: string, empresaId: string) {
    return this.prisma.fidelidadeRegra.delete({ where: { id, empresaId } });
  }
}
