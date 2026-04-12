import { Module } from '@nestjs/common';
import { PedidoTiposConfigController } from './pedido-tipos-config.controller';
import { PedidoTiposConfigService } from './pedido-tipos-config.service';

@Module({
  controllers: [PedidoTiposConfigController],
  providers: [PedidoTiposConfigService],
  exports: [PedidoTiposConfigService],
})
export class PedidoTiposConfigModule {}
