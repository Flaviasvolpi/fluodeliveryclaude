import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePedidoTipoConfigDto, UpdatePedidoTipoConfigDto } from './dto/pedido-tipos-config.dto';

@Injectable()
export class PedidoTiposConfigService {
  constructor(private prisma: PrismaService) {}

  findAll(empresaId: string) {
    return this.prisma.pedidoTipoConfig.findMany({
      where: { empresaId },
      orderBy: { ordem: 'asc' },
    });
  }

  create(empresaId: string, dto: CreatePedidoTipoConfigDto) {
    return this.prisma.pedidoTipoConfig.create({ data: { ...dto, empresaId } });
  }

  update(id: string, empresaId: string, dto: UpdatePedidoTipoConfigDto) {
    return this.prisma.pedidoTipoConfig.update({ where: { id, empresaId }, data: dto });
  }

  delete(id: string, empresaId: string) {
    return this.prisma.pedidoTipoConfig.delete({ where: { id, empresaId } });
  }
}
