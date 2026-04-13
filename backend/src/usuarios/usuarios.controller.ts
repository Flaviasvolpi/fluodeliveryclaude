import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { AssignRoleDto, CreateUsuarioDto, UpdateRolesDto } from './dto/usuarios.dto';
import { Roles } from '../common/decorators';

@Controller('empresas/:empresaId/usuarios')
export class UsuariosController {
  constructor(private service: UsuariosService) {}

  @Get()
  findAll(@Param('empresaId') empresaId: string) {
    return this.service.findAll(empresaId);
  }

  @Post('create')
  @Roles('admin')
  createUsuario(@Param('empresaId') empresaId: string, @Body() dto: CreateUsuarioDto) {
    return this.service.createUsuario(empresaId, dto);
  }

  @Post('update-roles')
  @Roles('admin')
  updateRoles(@Param('empresaId') empresaId: string, @Body() dto: UpdateRolesDto) {
    return this.service.updateRoles(empresaId, dto);
  }

  @Delete(':userId/remove')
  @Roles('admin')
  removeUsuario(@Param('empresaId') empresaId: string, @Param('userId') userId: string) {
    return this.service.removeUsuario(empresaId, userId);
  }

  @Post('assign-role')
  @Roles('admin')
  assignRole(@Param('empresaId') empresaId: string, @Body() dto: AssignRoleDto) {
    return this.service.assignRole(empresaId, dto);
  }

  @Delete('role/:id')
  @Roles('admin')
  deleteRole(@Param('empresaId') empresaId: string, @Param('id') id: string) {
    return this.service.deleteRole(id, empresaId);
  }
}
