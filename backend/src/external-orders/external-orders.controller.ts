import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ExternalOrdersService } from './external-orders.service';
import { CreateExternalOrderDto } from './dto/external-order.dto';
import { ApiKeyAuth } from '../common/decorators';

@Controller('v1')
export class ExternalOrdersController {
  constructor(private service: ExternalOrdersService) {}

  @ApiKeyAuth()
  @Post('pedidos')
  criarPedido(@Req() req: any, @Body() dto: CreateExternalOrderDto) {
    return this.service.criarPedidoExterno(req.empresa.id, dto);
  }

  @ApiKeyAuth()
  @Get('consultar-pedidos')
  consultarPedidos(
    @Req() req: any,
    @Query('telefone') telefone?: string,
    @Query('numero') numero?: string,
    @Query('status') status?: string,
  ) {
    return this.service.consultarPedidos(
      req.empresa.id,
      telefone,
      numero ? parseInt(numero) : undefined,
      status,
    );
  }
}
