import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PedidoStatusConfigService } from './pedido-status-config.service';
import { CreatePedidoStatusConfigDto, UpdatePedidoStatusConfigDto } from './dto/pedido-status-config.dto';
import { Roles } from '../common/decorators';

@Controller('empresas/:empresaId/pedido-status-config')
export class PedidoStatusConfigController {
  constructor(private service: PedidoStatusConfigService) {}

  @Get()
  findAll(@Param('empresaId') empresaId: string) {
    return this.service.findAll(empresaId);
  }

  @Post()
  @Roles('admin')
  create(@Param('empresaId') empresaId: string, @Body() dto: CreatePedidoStatusConfigDto) {
    return this.service.create(empresaId, dto);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('empresaId') empresaId: string, @Param('id') id: string, @Body() dto: UpdatePedidoStatusConfigDto) {
    return this.service.update(id, empresaId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('empresaId') empresaId: string, @Param('id') id: string) {
    return this.service.delete(id, empresaId);
  }
}
