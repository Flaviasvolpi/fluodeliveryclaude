import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AdicionaisService } from './adicionais.service';
import { Roles } from '../common/decorators';

@Controller('empresas/:empresaId/adicionais')
export class AdicionaisController {
  constructor(private service: AdicionaisService) {}

  @Get('grupos')
  findAllGrupos(@Param('empresaId') empresaId: string) {
    return this.service.findAllGrupos(empresaId);
  }

  @Post('grupos')
  @Roles('admin')
  createGrupo(@Param('empresaId') empresaId: string, @Body() dto: { nome: string; minSelect?: number; maxSelect?: number }) {
    return this.service.createGrupo(empresaId, dto);
  }

  @Patch('grupos/:id')
  @Roles('admin')
  updateGrupo(@Param('empresaId') empresaId: string, @Param('id') id: string, @Body() dto: any) {
    return this.service.updateGrupo(id, empresaId, dto);
  }

  @Delete('grupos/:id')
  @Roles('admin')
  deleteGrupo(@Param('empresaId') empresaId: string, @Param('id') id: string) {
    return this.service.deleteGrupo(id, empresaId);
  }

  @Get('grupos/:grupoId/itens')
  findItens(@Param('empresaId') empresaId: string, @Param('grupoId') grupoId: string) {
    return this.service.findItensByGrupo(grupoId, empresaId);
  }

  @Post('itens')
  @Roles('admin')
  createItem(@Param('empresaId') empresaId: string, @Body() dto: { grupoId: string; nome: string; preco?: number }) {
    return this.service.createItem(empresaId, dto);
  }

  @Patch('itens/:id')
  @Roles('admin')
  updateItem(@Param('empresaId') empresaId: string, @Param('id') id: string, @Body() dto: any) {
    return this.service.updateItem(id, empresaId, dto);
  }

  @Delete('itens/:id')
  @Roles('admin')
  deleteItem(@Param('empresaId') empresaId: string, @Param('id') id: string) {
    return this.service.deleteItem(id, empresaId);
  }
}
