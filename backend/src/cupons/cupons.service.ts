import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCupomDto, UpdateCupomDto } from './dto/cupons.dto';

@Injectable()
export class CuponsService {
  constructor(private prisma: PrismaService) {}

  findAll(empresaId: string) {
    return this.prisma.cupom.findMany({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(empresaId: string, dto: CreateCupomDto) {
    return this.prisma.cupom.create({ data: { ...dto, empresaId } });
  }

  update(id: string, empresaId: string, dto: UpdateCupomDto) {
    return this.prisma.cupom.update({ where: { id, empresaId }, data: dto });
  }

  delete(id: string, empresaId: string) {
    return this.prisma.cupom.delete({ where: { id, empresaId } });
  }
}
