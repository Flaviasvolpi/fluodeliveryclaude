import { Module } from '@nestjs/common';
import { EntregadoresController } from './entregadores.controller';
import { EntregadoresService } from './entregadores.service';

@Module({
  controllers: [EntregadoresController],
  providers: [EntregadoresService],
  exports: [EntregadoresService],
})
export class EntregadoresModule {}
