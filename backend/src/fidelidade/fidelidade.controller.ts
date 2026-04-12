import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { FidelidadeService } from './fidelidade.service';
import { CreateFidelidadeRegraDto, UpdateFidelidadeRegraDto } from './dto/fidelidade.dto';
import { Roles } from '../common/decorators';

@Controller('empresas/:empresaId/fidelidade')
export class FidelidadeController {
  constructor(private service: FidelidadeService) {}

  @Get()
  findAll(@Param('empresaId') empresaId: string) {
    return this.service.findAll(empresaId);
  }

  @Post()
  @Roles('admin')
  create(@Param('empresaId') empresaId: string, @Body() dto: CreateFidelidadeRegraDto) {
    return this.service.create(empresaId, dto);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('empresaId') empresaId: string, @Param('id') id: string, @Body() dto: UpdateFidelidadeRegraDto) {
    return this.service.update(id, empresaId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('empresaId') empresaId: string, @Param('id') id: string) {
    return this.service.delete(id, empresaId);
  }
}
