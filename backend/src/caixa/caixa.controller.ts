import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CaixaService } from './caixa.service';
import {
  AbrirCaixaDto, FecharCaixaDto, CreateRecebimentoDto,
  CreateAcertoDto, AbrirEntregadorCaixaDto, CreateEntregadorRecebimentoDto,
} from './dto/caixa.dto';
import { Roles } from '../common/decorators';

@Controller('empresas/:empresaId/caixa')
export class CaixaController {
  constructor(private service: CaixaService) {}

  // --- Sessões ---
  @Get('sessoes')
  findSessoes(@Param('empresaId') empresaId: string, @Query('status') status?: string) {
    return this.service.findAllSessoes(empresaId, status);
  }

  @Post('sessoes/abrir')
  @Roles('admin', 'atendente')
  abrirSessao(@Param('empresaId') empresaId: string, @Body() dto: AbrirCaixaDto) {
    return this.service.abrirSessao(empresaId, dto);
  }

  @Post('sessoes/:id/fechar')
  @Roles('admin', 'atendente')
  fecharSessao(@Param('empresaId') empresaId: string, @Param('id') id: string, @Body() dto: FecharCaixaDto) {
    return this.service.fecharSessao(id, empresaId, dto);
  }

  @Get('sessoes/:id')
  getSessaoDetail(@Param('empresaId') empresaId: string, @Param('id') id: string) {
    return this.service.getSessaoDetail(id, empresaId);
  }

  // --- Recebimentos ---
  @Get('recebimentos')
  findRecebimentos(@Param('empresaId') empresaId: string, @Query('caixaSessaoId') caixaSessaoId?: string) {
    return this.service.findRecebimentos(empresaId, caixaSessaoId);
  }

  @Post('recebimentos')
  @Roles('admin', 'atendente')
  createRecebimento(@Param('empresaId') empresaId: string, @Body() dto: CreateRecebimentoDto) {
    return this.service.createRecebimento(empresaId, dto);
  }

  // --- Motoboy Acertos ---
  @Get('acertos')
  findAcertos(@Param('empresaId') empresaId: string, @Query('caixaSessaoId') caixaSessaoId?: string) {
    return this.service.findAcertos(empresaId, caixaSessaoId);
  }

  @Post('acertos')
  @Roles('admin', 'atendente')
  createAcerto(@Param('empresaId') empresaId: string, @Body() dto: CreateAcertoDto) {
    return this.service.createAcerto(empresaId, dto);
  }

  // --- Entregador Caixa ---
  @Get('entregador-caixa')
  findEntregadorCaixas(@Param('empresaId') empresaId: string, @Query('status') status?: string) {
    return this.service.findEntregadorCaixas(empresaId, status);
  }

  @Post('entregador-caixa/abrir')
  @Roles('admin', 'atendente')
  abrirEntregadorCaixa(@Param('empresaId') empresaId: string, @Body() dto: AbrirEntregadorCaixaDto) {
    return this.service.abrirEntregadorCaixa(empresaId, dto);
  }

  @Post('entregador-caixa/:id/fechar')
  @Roles('admin', 'atendente')
  fecharEntregadorCaixa(@Param('empresaId') empresaId: string, @Param('id') id: string) {
    return this.service.fecharEntregadorCaixa(id, empresaId);
  }

  @Post('entregador-recebimentos')
  @Roles('admin', 'atendente')
  createEntregadorRecebimento(@Param('empresaId') empresaId: string, @Body() dto: CreateEntregadorRecebimentoDto) {
    return this.service.createEntregadorRecebimento(empresaId, dto);
  }
}
