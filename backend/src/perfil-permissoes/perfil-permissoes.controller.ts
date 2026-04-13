import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { PerfilPermissoesService } from './perfil-permissoes.service';
import { CreatePerfilPermissaoDto } from './dto/perfil-permissoes.dto';
import { Roles } from '../common/decorators';

@Controller('empresas/:empresaId/perfil-permissoes')
export class PerfilPermissoesController {
  constructor(private service: PerfilPermissoesService) {}

  @Get()
  findAll(@Param('empresaId') empresaId: string) {
    return this.service.findAll(empresaId);
  }

  @Post()
  @Roles('admin')
  create(@Param('empresaId') empresaId: string, @Body() dto: CreatePerfilPermissaoDto) {
    return this.service.create(empresaId, dto);
  }

  @Delete('by-role/:role')
  @Roles('admin')
  deleteByRole(@Param('empresaId') empresaId: string, @Param('role') role: string) {
    return this.service.deleteByRole(empresaId, role);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('empresaId') empresaId: string, @Param('id') id: string) {
    return this.service.delete(id, empresaId);
  }
}
