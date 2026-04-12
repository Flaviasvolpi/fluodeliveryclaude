import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePedidoStatusConfigDto, UpdatePedidoStatusConfigDto } from './dto/pedido-status-config.dto';

@Injectable()
export class PedidoStatusConfigService {
  constructor(private prisma: PrismaService) {}

  findAll(empresaId: string) {
    return this.prisma.pedidoStatusConfig.findMany({
      where: { empresaId },
      orderBy: { ordem: 'asc' },
    });
  }

  create(empresaId: string, dto: CreatePedidoStatusConfigDto) {
    return this.prisma.pedidoStatusConfig.create({ data: { ...dto, empresaId } });
  }

  update(id: string, empresaId: string, dto: UpdatePedidoStatusConfigDto) {
    return this.prisma.pedidoStatusConfig.update({ where: { id, empresaId }, data: dto });
  }

  delete(id: string, empresaId: string) {
    return this.prisma.pedidoStatusConfig.delete({ where: { id, empresaId } });
  }
}
