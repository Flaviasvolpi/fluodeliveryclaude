import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { FormasPagamentoService } from './formas-pagamento.service';
import { CreateFormaPagamentoDto, UpdateFormaPagamentoDto } from './dto/formas-pagamento.dto';
import { Roles, Public } from '../common/decorators';

@Controller('empresas/:empresaId/formas-pagamento')
export class FormasPagamentoController {
  constructor(private service: FormasPagamentoService) {}

  @Public()
  @Get()
  findAll(@Param('empresaId') empresaId: string) {
    return this.service.findAll(empresaId);
  }

  @Post()
  @Roles('admin')
  create(@Param('empresaId') empresaId: string, @Body() dto: CreateFormaPagamentoDto) {
    return this.service.create(empresaId, dto);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('empresaId') empresaId: string, @Param('id') id: string, @Body() dto: UpdateFormaPagamentoDto) {
    return this.service.update(id, empresaId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('empresaId') empresaId: string, @Param('id') id: string) {
    return this.service.delete(id, empresaId);
  }
}
