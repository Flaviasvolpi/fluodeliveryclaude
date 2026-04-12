import { Module } from '@nestjs/common';
import { PedidoStatusConfigController } from './pedido-status-config.controller';
import { PedidoStatusConfigService } from './pedido-status-config.service';

@Module({
  controllers: [PedidoStatusConfigController],
  providers: [PedidoStatusConfigService],
  exports: [PedidoStatusConfigService],
})
export class PedidoStatusConfigModule {}
