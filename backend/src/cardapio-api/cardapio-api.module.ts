import { Module } from '@nestjs/common';
import { CardapioApiController } from './cardapio-api.controller';
import { CardapioApiService } from './cardapio-api.service';

@Module({
  controllers: [CardapioApiController],
  providers: [CardapioApiService],
})
export class CardapioApiModule {}
