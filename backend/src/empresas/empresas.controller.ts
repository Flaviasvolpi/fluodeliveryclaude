import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { CreateEmpresaDto, UpdateEmpresaDto } from './dto/create-empresa.dto';
import { Public, Roles, CurrentUser } from '../common/decorators';
import type { JwtPayload } from '../common/decorators';

@Controller('empresas')
export class EmpresasController {
  constructor(private service: EmpresasService) {}

  @Public()
  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Get('mine')
  findMyEmpresas(@CurrentUser() user: JwtPayload) {
    return this.service.findByUserId(user.sub);
  }

  @Get(':empresaId')
  findById(@Param('empresaId') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateEmpresaDto) {
    return this.service.create(dto);
  }

  @Patch(':empresaId')
  @Roles('admin')
  update(@Param('empresaId') id: string, @Body() dto: UpdateEmpresaDto) {
    return this.service.update(id, dto);
  }

  @Get(':empresaId/api-key')
  @Roles('admin')
  getApiKey(@Param('empresaId') empresaId: string) {
    return this.service.getApiKey(empresaId);
  }

  @Post(':empresaId/api-key/regenerate')
  @Roles('admin')
  regenerateApiKey(@Param('empresaId') empresaId: string) {
    return this.service.regenerateApiKey(empresaId);
  }
}
