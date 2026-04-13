import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ConfiguracoesService } from './configuracoes.service';
import { UpsertConfiguracaoDto } from './dto/configuracoes.dto';
import { Roles, Public } from '../common/decorators';

@Controller('empresas/:empresaId/configuracoes')
export class ConfiguracoesController {
  constructor(private service: ConfiguracoesService) {}

  @Public()
  @Get()
  findAll(@Param('empresaId') empresaId: string) {
    return this.service.findAll(empresaId);
  }

  @Post()
  @Roles('admin')
  upsert(@Param('empresaId') empresaId: string, @Body() dto: UpsertConfiguracaoDto) {
    return this.service.upsert(empresaId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('empresaId') empresaId: string, @Param('id') id: string) {
    return this.service.delete(id, empresaId);
  }
}
