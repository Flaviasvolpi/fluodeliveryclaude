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

  async bulkUpsert(empresaId: string, rows: any[]) {
    // Delete existing tipos for this empresa, then recreate
    await this.prisma.pedidoTipoConfig.deleteMany({ where: { empresaId } });
    const created = [];
    for (const row of rows) {
      const item = await this.prisma.pedidoTipoConfig.create({
        data: {
          empresaId,
          tipoKey: row.tipoKey,
          label: row.label,
          ativo: row.ativo ?? true,
          ordem: row.ordem ?? 0,
          origem: row.origem,
          exigeEndereco: row.exigeEndereco,
          exigeMesa: row.exigeMesa,
          exigeReferencia: row.exigeReferencia,
          referenciaAuto: row.referenciaAuto,
          referenciaLabel: row.referenciaLabel,
        },
      });
      created.push(item);
    }
    return created;
  }
}
