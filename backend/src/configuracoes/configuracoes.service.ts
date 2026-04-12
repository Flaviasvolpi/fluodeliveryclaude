import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertConfiguracaoDto } from './dto/configuracoes.dto';

@Injectable()
export class ConfiguracoesService {
  constructor(private prisma: PrismaService) {}

  findAll(empresaId: string) {
    return this.prisma.configuracao.findMany({ where: { empresaId } });
  }

  async upsert(empresaId: string, dto: UpsertConfiguracaoDto) {
    const existing = await this.prisma.configuracao.findFirst({
      where: { empresaId, chave: dto.chave },
    });
    if (existing) {
      return this.prisma.configuracao.update({
        where: { id: existing.id },
        data: { valor: dto.valor ?? '' },
      });
    }
    return this.prisma.configuracao.create({
      data: { empresaId, chave: dto.chave, valor: dto.valor ?? '' },
    });
  }

  delete(id: string, empresaId: string) {
    return this.prisma.configuracao.delete({ where: { id, empresaId } });
  }
}
