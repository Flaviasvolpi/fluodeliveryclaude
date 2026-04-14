import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { IfoodApiService } from './ifood-api.service';

export interface PedidoStatusChangedEvent {
  empresaId: string;
  pedidoId: string;
  ifoodOrderId: string | null;
  newStatus: string;
}

@Injectable()
export class IfoodStatusService {
  constructor(
    private prisma: PrismaService,
    private ifoodApi: IfoodApiService,
  ) {}

  @OnEvent('pedido.status.changed')
  async handleStatusChanged(event: PedidoStatusChangedEvent): Promise<void> {
    if (!event.ifoodOrderId) return;

    try {
      const mapping = await this.prisma.ifoodStatusMapping.findUnique({
        where: {
          empresaId_localStatusKey: {
            empresaId: event.empresaId,
            localStatusKey: event.newStatus,
          },
        },
      });

      if (!mapping?.ifoodAction) return;

      switch (mapping.ifoodAction) {
        case 'confirm':
          await this.ifoodApi.confirmOrder(event.empresaId, event.ifoodOrderId);
          break;
        case 'startPreparation':
          await this.ifoodApi.startPreparation(event.empresaId, event.ifoodOrderId);
          break;
        case 'readyToPickup':
          await this.ifoodApi.readyToPickup(event.empresaId, event.ifoodOrderId);
          break;
        case 'dispatch':
          await this.ifoodApi.dispatchOrder(event.empresaId, event.ifoodOrderId);
          break;
      }
    } catch (err) {
      console.error(`[iFood] Status sync error for order ${event.ifoodOrderId}:`, err.message);
    }
  }
}
