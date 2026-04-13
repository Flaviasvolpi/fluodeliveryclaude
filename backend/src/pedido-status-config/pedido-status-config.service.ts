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

  async bulkUpsert(empresaId: string, rows: any[]) {
    await this.prisma.pedidoStatusConfig.deleteMany({ where: { empresaId } });
    const created = [];
    for (const row of rows) {
      const item = await this.prisma.pedidoStatusConfig.create({
        data: {
          empresaId,
          statusKey: row.statusKey,
          label: row.label,
          cor: row.cor ?? 'blue',
          ativo: row.ativo ?? true,
          ordem: row.ordem ?? 0,
          tiposAplicaveis: row.tiposAplicaveis ?? ['retirada', 'entrega', 'mesa'],
        },
      });
      created.push(item);
    }
    return created;
  }
}
