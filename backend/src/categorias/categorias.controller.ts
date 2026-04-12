import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CategoriasService } from './categorias.service';
import { CreateCategoriaDto, UpdateCategoriaDto } from './dto/create-categoria.dto';
import { Roles } from '../common/decorators';

@Controller('empresas/:empresaId/categorias')
export class CategoriasController {
  constructor(private service: CategoriasService) {}

  @Get()
  findAll(@Param('empresaId') empresaId: string) {
    return this.service.findAll(empresaId);
  }

  @Post()
  @Roles('admin')
  create(@Param('empresaId') empresaId: string, @Body() dto: CreateCategoriaDto) {
    return this.service.create(empresaId, dto);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('empresaId') empresaId: string, @Param('id') id: string, @Body() dto: UpdateCategoriaDto) {
    return this.service.update(id, empresaId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('empresaId') empresaId: string, @Param('id') id: string) {
    return this.service.delete(id, empresaId);
  }
}
