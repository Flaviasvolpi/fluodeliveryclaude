import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { MesasService } from './mesas.service';
import { CreateMesaDto, UpdateMesaDto } from './dto/mesas.dto';
import { Roles } from '../common/decorators';

@Controller('empresas/:empresaId/mesas')
export class MesasController {
  constructor(private service: MesasService) {}

  @Get()
  findAll(@Param('empresaId') empresaId: string) {
    return this.service.findAll(empresaId);
  }

  @Post()
  @Roles('admin')
  create(@Param('empresaId') empresaId: string, @Body() dto: CreateMesaDto) {
    return this.service.create(empresaId, dto);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('empresaId') empresaId: string, @Param('id') id: string, @Body() dto: UpdateMesaDto) {
    return this.service.update(id, empresaId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('empresaId') empresaId: string, @Param('id') id: string) {
    return this.service.delete(id, empresaId);
  }
}
