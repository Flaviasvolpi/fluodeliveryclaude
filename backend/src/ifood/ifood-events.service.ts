import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IfoodApiService } from './ifood-api.service';
import { IfoodOrdersService } from './ifood-orders.service';

@Injectable()
export class IfoodEventsService {
  constructor(
    private prisma: PrismaService,
    private ifoodApi: IfoodApiService,
    private ifoodOrders: IfoodOrdersService,
  ) {}

  async processEvents(empresaId: string): Promise<void> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { ifoodMerchantId: true, ifoodAtivo: true },
    });

    if (!empresa?.ifoodAtivo || !empresa.ifoodMerchantId) return;

    let events: any[];
    try {
      events = await this.ifoodApi.pollEvents(empresaId);
    } catch (err) {
      console.error(`[iFood] Poll error for empresa ${empresaId}:`, err.message);
      return;
    }

    if (!events?.length) return;

    const processedIds: string[] = [];

    for (const event of events) {
      try {
        await this.processSingleEvent(empresaId, event);
        processedIds.push(event.id);
      } catch (err) {
        console.error(`[iFood] Event processing error:`, event.id, err.message);
        // Still acknowledge to prevent re-delivery
        processedIds.push(event.id);
      }
    }

    // Acknowledge all events
    if (processedIds.length) {
      try {
        await this.ifoodApi.ackEvents(empresaId, processedIds);
      } catch (err) {
        console.error(`[iFood] ACK error:`, err.message);
      }
    }
  }

  async processSingleEvent(empresaId: string, event: any): Promise<void> {
    const eventId = event.id;
    const eventType = event.fullCode ?? event.code ?? '';
    const orderId = event.orderId ?? event.data?.orderId ?? event.data?.id ?? '';

    // Dedup check
    const existing = await this.prisma.ifoodEventLog.findUnique({
      where: { empresaId_eventId: { empresaId, eventId } },
    });
    if (existing) return;

    // Route by event type
    switch (eventType) {
      case 'PLACED':
      case 'CREATED':
        await this.ifoodOrders.ingestOrder(empresaId, orderId);
        break;

      case 'CANCELLED':
      case 'CANCELLATION_REQUESTED': {
        const pedido = await this.prisma.pedido.findFirst({
          where: { empresaId, ifoodOrderId: orderId },
        });
        if (pedido) {
          await this.prisma.pedido.update({
            where: { id: pedido.id },
            data: { pedidoStatus: 'cancelado' },
          });
        }
        break;
      }

      case 'CONFIRMED':
      case 'PREPARATION_STARTED':
      case 'READY_TO_PICKUP':
      case 'DISPATCHED':
      case 'CONCLUDED': {
        // Status updates from iFood (e.g., driver events)
        const statusMap: Record<string, string> = {
          CONFIRMED: 'confirmado',
          PREPARATION_STARTED: 'preparo',
          READY_TO_PICKUP: 'pronto',
          DISPATCHED: 'saiu_entrega',
          CONCLUDED: 'entregue',
        };
        const newStatus = statusMap[eventType];
        if (newStatus) {
          const pedido = await this.prisma.pedido.findFirst({
            where: { empresaId, ifoodOrderId: orderId },
          });
          if (pedido) {
            await this.prisma.pedido.update({
              where: { id: pedido.id },
              data: { pedidoStatus: newStatus },
            });
          }
        }
        break;
      }

      default:
        // Delivery events, driver events, etc. — log but don't act
        break;
    }

    // Log event
    await this.prisma.ifoodEventLog.create({
      data: {
        empresaId,
        eventId,
        eventType,
        ifoodOrderId: orderId,
        payload: event,
      },
    });
  }
}
