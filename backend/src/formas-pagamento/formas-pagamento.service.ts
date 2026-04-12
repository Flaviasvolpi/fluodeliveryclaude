import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormaPagamentoDto, UpdateFormaPagamentoDto } from './dto/formas-pagamento.dto';

@Injectable()
export class FormasPagamentoService {
  constructor(private prisma: PrismaService) {}

  findAll(empresaId: string) {
    return this.prisma.formaPagamento.findMany({ where: { empresaId } });
  }

  create(empresaId: string, dto: CreateFormaPagamentoDto) {
    return this.prisma.formaPagamento.create({ data: { ...dto, empresaId } });
  }

  update(id: string, empresaId: string, dto: UpdateFormaPagamentoDto) {
    return this.prisma.formaPagamento.update({ where: { id, empresaId }, data: dto });
  }

  delete(id: string, empresaId: string) {
    return this.prisma.formaPagamento.delete({ where: { id, empresaId } });
  }
}
