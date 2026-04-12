import { Module } from '@nestjs/common';
import { FormasPagamentoController } from './formas-pagamento.controller';
import { FormasPagamentoService } from './formas-pagamento.service';

@Module({
  controllers: [FormasPagamentoController],
  providers: [FormasPagamentoService],
  exports: [FormasPagamentoService],
})
export class FormasPagamentoModule {}
