import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CuponsService } from './cupons.service';
import { CreateCupomDto, UpdateCupomDto } from './dto/cupons.dto';
import { Roles, Public } from '../common/decorators';

@Controller('empresas/:empresaId/cupons')
export class CuponsController {
  constructor(private service: CuponsService) {}

  @Public()
  @Get()
  findAll(@Param('empresaId') empresaId: string) {
    return this.service.findAll(empresaId);
  }

  @Post()
  @Roles('admin')
  create(@Param('empresaId') empresaId: string, @Body() dto: CreateCupomDto) {
    return this.service.create(empresaId, dto);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('empresaId') empresaId: string, @Param('id') id: string, @Body() dto: UpdateCupomDto) {
    return this.service.update(id, empresaId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('empresaId') empresaId: string, @Param('id') id: string) {
    return this.service.delete(id, empresaId);
  }
}
