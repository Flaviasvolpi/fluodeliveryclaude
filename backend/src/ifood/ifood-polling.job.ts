import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IfoodEventsService } from './ifood-events.service';
import { IfoodCatalogService } from './ifood-catalog.service';

const POLL_INTERVAL_MS = 30_000; // 30 seconds (iFood mandatory)
const CATALOG_MIN_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

@Injectable()
export class IfoodPollingJob implements OnModuleInit, OnModuleDestroy {
  private intervalRef: NodeJS.Timeout | null = null;

  constructor(
    private prisma: PrismaService,
    private eventsService: IfoodEventsService,
    private catalogService: IfoodCatalogService,
  ) {}

  onModuleInit() {
    this.intervalRef = setInterval(() => this.pollAll(), POLL_INTERVAL_MS);
    console.log('[iFood] Polling job started (every 30s)');
  }

  onModuleDestroy() {
    if (this.intervalRef) clearInterval(this.intervalRef);
  }

  private async pollAll(): Promise<void> {
    // 1. Poll order events for all active empresas (not using webhook)
    const empresas = await this.prisma.empresa.findMany({
      where: { ifoodAtivo: true, ifoodWebhookMode: false },
      select: { id: true },
    });

    for (const empresa of empresas) {
      try {
        await this.eventsService.processEvents(empresa.id);
      } catch (err) {
        console.error(`[iFood] Poll error empresa ${empresa.id}:`, err.message);
      }
    }

    // 2. Check pending catalog syncs
    const pendingSyncs = await this.prisma.ifoodCatalogSync.findMany({
      where: { pendingSync: true },
    });

    for (const sync of pendingSyncs) {
      const elapsed = sync.lastSyncAt ? Date.now() - sync.lastSyncAt.getTime() : Infinity;
      if (elapsed >= CATALOG_MIN_INTERVAL_MS) {
        try {
          await this.catalogService.pushCatalog(sync.empresaId);
        } catch (err) {
          console.error(`[iFood] Catalog sync error empresa ${sync.empresaId}:`, err.message);
        }
      }
    }
  }
}
