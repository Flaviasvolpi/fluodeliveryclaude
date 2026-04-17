import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ContasService } from './contas.service';
import { AddContaPagamentoDto, FecharContaDto } from './dto/contas.dto';
import { Roles } from '../common/decorators';

@Controller('empresas/:empresaId/contas')
export class ContasController {
  constructor(private service: ContasService) {}

  @Get()
  findAll(@Param('empresaId') empresaId: string, @Query('status') status?: string) {
    return this.service.findAll(empresaId, status);
  }

  @Get(':id')
  findOne(@Param('empresaId') empresaId: string, @Param('id') id: string) {
    return this.service.findOne(id, empresaId);
  }

  @Post('pagamentos')
  addPagamento(@Param('empresaId') empresaId: string, @Body() dto: AddContaPagamentoDto) {
    return this.service.addPagamento(empresaId, dto);
  }

  @Post(':id/fechar')
  fecharConta(
    @Param('empresaId') empresaId: string,
    @Param('id') id: string,
    @Body() body?: { incluirTaxaServico?: boolean },
  ) {
    return this.service.fecharConta(id, empresaId, body);
  }
}
