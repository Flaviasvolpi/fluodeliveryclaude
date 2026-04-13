import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePerfilPermissaoDto } from './dto/perfil-permissoes.dto';

@Injectable()
export class PerfilPermissoesService {
  constructor(private prisma: PrismaService) {}

  findAll(empresaId: string) {
    return this.prisma.perfilPermissao.findMany({ where: { empresaId } });
  }

  create(empresaId: string, dto: CreatePerfilPermissaoDto) {
    return this.prisma.perfilPermissao.create({ data: { ...dto, empresaId } });
  }

  delete(id: string, empresaId: string) {
    return this.prisma.perfilPermissao.delete({ where: { id, empresaId } });
  }

  deleteByRole(empresaId: string, role: string) {
    return this.prisma.perfilPermissao.deleteMany({
      where: { empresaId, role: role as any },
    });
  }
}
