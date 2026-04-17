import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Roles, Public } from '../common/decorators';
import { TaxasEntregaService } from './taxas-entrega.service';

@Controller('empresas/:empresaId/taxas-entrega')
export class TaxasEntregaController {
  constructor(private service: TaxasEntregaService) {}

  @Get()
  @Public()
  findAll(@Param('empresaId') empresaId: string) {
    return this.service.findAll(empresaId);
  }

  @Post()
  @Roles('admin')
  create(@Param('empresaId') empresaId: string, @Body() dto: any) {
    return this.service.create(empresaId, dto);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('empresaId') empresaId: string, @Param('id') id: string, @Body() dto: any) {
    return this.service.update(empresaId, id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('empresaId') empresaId: string, @Param('id') id: string) {
    return this.service.delete(empresaId, id);
  }

  @Post('resolve')
  @Public()
  resolve(
    @Param('empresaId') empresaId: string,
    @Body() body: { cep: string; subtotal: number },
  ) {
    return this.service.resolve(empresaId, body.cep, body.subtotal);
  }
}
