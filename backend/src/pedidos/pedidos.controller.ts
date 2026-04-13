import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import {
  CreatePedidoDto,
  UpdatePedidoDto,
  UpdatePedidoStatusDto,
  QueryPedidosDto,
} from './dto/pedidos.dto';
import { Roles, Public } from '../common/decorators';

@Controller('empresas/:empresaId/pedidos')
export class PedidosController {
  constructor(private service: PedidosService) {}

  @Public()
  @Post()
  async create(
    @Param('empresaId') empresaId: string,
    @Body() dto: CreatePedidoDto,
  ) {
    const numero = await this.service.criarPedido(empresaId, dto);
    return { numeroPedido: numero };
  }

  @Get()
  findAll(
    @Param('empresaId') empresaId: string,
    @Query() query: QueryPedidosDto,
  ) {
    return this.service.findAll(empresaId, query);
  }

  @Get(':id')
  findOne(
    @Param('empresaId') empresaId: string,
    @Param('id') id: string,
  ) {
    return this.service.findOne(id, empresaId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('empresaId') empresaId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePedidoStatusDto,
  ) {
    return this.service.updateStatus(id, empresaId, dto.pedidoStatus);
  }

  @Patch(':id')
  update(
    @Param('empresaId') empresaId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePedidoDto,
  ) {
    return this.service.update(id, empresaId, dto);
  }
}
