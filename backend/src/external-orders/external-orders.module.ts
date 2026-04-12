import { Module } from '@nestjs/common';
import { ExternalOrdersController } from './external-orders.controller';
import { ExternalOrdersService } from './external-orders.service';
import { PedidosModule } from '../pedidos/pedidos.module';

@Module({
  imports: [PedidosModule],
  controllers: [ExternalOrdersController],
  providers: [ExternalOrdersService],
})
export class ExternalOrdersModule {}
