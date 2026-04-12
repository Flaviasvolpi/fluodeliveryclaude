import { Controller, Get, Query, Req } from '@nestjs/common';
import { CardapioApiService } from './cardapio-api.service';
import { ApiKeyAuth } from '../common/decorators';

@Controller('v1')
export class CardapioApiController {
  constructor(private service: CardapioApiService) {}

  @ApiKeyAuth()
  @Get('cardapio')
  getCardapio(@Req() req: any) {
    return this.service.getCardapio(req.empresa.id);
  }

  @ApiKeyAuth()
  @Get('buscar-produtos')
  buscarProdutos(
    @Req() req: any,
    @Query('q') q?: string,
    @Query('categoria') categoriaId?: string,
  ) {
    return this.service.buscarProdutos(req.empresa.id, q, categoriaId);
  }
}
