import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ProdutosService } from './produtos.service';
import { CreateProdutoDto, UpdateProdutoDto } from './dto/create-produto.dto';
import { Roles } from '../common/decorators';

@Controller('empresas/:empresaId/produtos')
export class ProdutosController {
  constructor(private service: ProdutosService) {}

  @Get()
  findAll(@Param('empresaId') empresaId: string) {
    return this.service.findAll(empresaId);
  }

  @Get(':id')
  findOne(@Param('empresaId') empresaId: string, @Param('id') id: string) {
    return this.service.findOne(id, empresaId);
  }

  @Post()
  @Roles('admin')
  create(@Param('empresaId') empresaId: string, @Body() dto: CreateProdutoDto) {
    return this.service.create(empresaId, dto);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('empresaId') empresaId: string, @Param('id') id: string, @Body() dto: UpdateProdutoDto) {
    return this.service.update(id, empresaId, dto);
  }

  @Patch(':id/toggle')
  @Roles('admin')
  toggleAtivo(@Param('empresaId') empresaId: string, @Param('id') id: string, @Body('ativo') ativo: boolean) {
    return this.service.toggleAtivo(id, empresaId, ativo);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('empresaId') empresaId: string, @Param('id') id: string) {
    return this.service.delete(id, empresaId);
  }
}
