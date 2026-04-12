import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { EntregadoresService } from './entregadores.service';
import { CreateEntregadorDto, UpdateEntregadorDto } from './dto/entregadores.dto';
import { Roles } from '../common/decorators';

@Controller('empresas/:empresaId/entregadores')
export class EntregadoresController {
  constructor(private service: EntregadoresService) {}

  @Get()
  findAll(@Param('empresaId') empresaId: string) {
    return this.service.findAll(empresaId);
  }

  @Post()
  @Roles('admin')
  create(@Param('empresaId') empresaId: string, @Body() dto: CreateEntregadorDto) {
    return this.service.create(empresaId, dto);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('empresaId') empresaId: string, @Param('id') id: string, @Body() dto: UpdateEntregadorDto) {
    return this.service.update(id, empresaId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('empresaId') empresaId: string, @Param('id') id: string) {
    return this.service.delete(id, empresaId);
  }
}
