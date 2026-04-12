import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { AssignRoleDto } from './dto/usuarios.dto';
import { Roles } from '../common/decorators';

@Controller('empresas/:empresaId/usuarios')
export class UsuariosController {
  constructor(private service: UsuariosService) {}

  @Get()
  findAll(@Param('empresaId') empresaId: string) {
    return this.service.findAll(empresaId);
  }

  @Post()
  @Roles('admin')
  assignRole(@Param('empresaId') empresaId: string, @Body() dto: AssignRoleDto) {
    return this.service.assignRole(empresaId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  deleteRole(@Param('empresaId') empresaId: string, @Param('id') id: string) {
    return this.service.deleteRole(id, empresaId);
  }
}
