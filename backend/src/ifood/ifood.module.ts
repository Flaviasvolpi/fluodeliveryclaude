import { Module } from '@nestjs/common';
import { PedidosModule } from '../pedidos/pedidos.module';
import { IfoodController, HorariosController } from './ifood.controller';
import { IfoodWebhookController } from './ifood-webhook.controller';
import { IfoodAuthService } from './ifood-auth.service';
import { IfoodApiService } from './ifood-api.service';
import { IfoodEventsService } from './ifood-events.service';
import { IfoodOrdersService } from './ifood-orders.service';
import { IfoodCatalogService } from './ifood-catalog.service';
import { IfoodStatusService } from './ifood-status.service';
import { IfoodPollingJob } from './ifood-polling.job';

@Module({
  imports: [PedidosModule],
  controllers: [IfoodController, HorariosController, IfoodWebhookController],
  providers: [
    IfoodAuthService,
    IfoodApiService,
    IfoodEventsService,
    IfoodOrdersService,
    IfoodCatalogService,
    IfoodStatusService,
    IfoodPollingJob,
  ],
  exports: [IfoodStatusService],
})
export class IfoodModule {}
