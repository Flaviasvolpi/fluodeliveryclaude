import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../common/decorators';

@Controller('empresas/:empresaId/produto-adicionais-grupos')
export class ProdutoAdicionaisGruposController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll(@Param('empresaId') empresaId: string) {
    return this.prisma.produtoAdicionaisGrupo.findMany({
      where: { empresaId },
      include: { grupo: true },
    });
  }

  @Post()
  @Roles('admin')
  async create(@Param('empresaId') empresaId: string, @Body() dto: any) {
    if (Array.isArray(dto)) {
      return this.prisma.produtoAdicionaisGrupo.createMany({
        data: dto.map((d: any) => ({ ...d, empresaId })),
      });
    }
    return this.prisma.produtoAdicionaisGrupo.create({ data: { ...dto, empresaId } });
  }

  @Delete()
  @Roles('admin')
  deleteAll(@Param('empresaId') empresaId: string) {
    return this.prisma.produtoAdicionaisGrupo.deleteMany({ where: { empresaId } });
  }

  @Delete(':produtoId/:grupoId')
  @Roles('admin')
  delete(
    @Param('produtoId') produtoId: string,
    @Param('grupoId') grupoId: string,
  ) {
    return this.prisma.produtoAdicionaisGrupo.delete({
      where: { produtoId_grupoId: { produtoId, grupoId } },
    });
  }
}
