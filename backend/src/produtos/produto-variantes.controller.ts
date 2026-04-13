import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../common/decorators';

@Controller('empresas/:empresaId/produto-variantes')
export class ProdutoVariantesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll(@Param('empresaId') empresaId: string) {
    return this.prisma.produtoVariante.findMany({
      where: { empresaId },
      orderBy: { ordem: 'asc' },
    });
  }

  @Post()
  @Roles('admin')
  async create(@Param('empresaId') empresaId: string, @Body() dto: any) {
    if (Array.isArray(dto)) {
      return this.prisma.produtoVariante.createMany({
        data: dto.map((v: any) => ({ ...v, empresaId })),
      });
    }
    return this.prisma.produtoVariante.create({ data: { ...dto, empresaId } });
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('empresaId') empresaId: string, @Param('id') id: string, @Body() dto: any) {
    return this.prisma.produtoVariante.update({ where: { id, empresaId }, data: dto });
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('empresaId') empresaId: string, @Param('id') id: string) {
    return this.prisma.produtoVariante.delete({ where: { id, empresaId } });
  }
}
