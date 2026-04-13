import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { PedidoTiposConfigService } from './pedido-tipos-config.service';
import { CreatePedidoTipoConfigDto, UpdatePedidoTipoConfigDto } from './dto/pedido-tipos-config.dto';
import { Roles } from '../common/decorators';

@Controller('empresas/:empresaId/pedido-tipos-config')
export class PedidoTiposConfigController {
  constructor(private service: PedidoTiposConfigService) {}

  @Get()
  findAll(@Param('empresaId') empresaId: string) {
    return this.service.findAll(empresaId);
  }

  @Put('bulk')
  @Roles('admin')
  bulkUpsert(@Param('empresaId') empresaId: string, @Body() rows: any[]) {
    return this.service.bulkUpsert(empresaId, rows);
  }

  @Post()
  @Roles('admin')
  create(@Param('empresaId') empresaId: string, @Body() dto: CreatePedidoTipoConfigDto) {
    return this.service.create(empresaId, dto);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('empresaId') empresaId: string, @Param('id') id: string, @Body() dto: UpdatePedidoTipoConfigDto) {
    return this.service.update(id, empresaId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('empresaId') empresaId: string, @Param('id') id: string) {
    return this.service.delete(id, empresaId);
  }
}
