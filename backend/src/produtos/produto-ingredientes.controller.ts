import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../common/decorators';

@Controller('empresas/:empresaId/produto-ingredientes')
export class ProdutoIngredientesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll(@Param('empresaId') empresaId: string) {
    return this.prisma.produtoIngrediente.findMany({
      where: { empresaId },
      orderBy: { ordem: 'asc' },
    });
  }

  @Post()
  @Roles('admin')
  async create(@Param('empresaId') empresaId: string, @Body() dto: any) {
    if (Array.isArray(dto)) {
      return this.prisma.produtoIngrediente.createMany({
        data: dto.map((i: any) => ({ ...i, empresaId })),
      });
    }
    return this.prisma.produtoIngrediente.create({ data: { ...dto, empresaId } });
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('empresaId') empresaId: string, @Param('id') id: string, @Body() dto: any) {
    return this.prisma.produtoIngrediente.update({ where: { id, empresaId }, data: dto });
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('empresaId') empresaId: string, @Param('id') id: string) {
    return this.prisma.produtoIngrediente.delete({ where: { id, empresaId } });
  }
}
