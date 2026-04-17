import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function sanitizeCep(cep: string | undefined | null): string {
  const only = String(cep ?? '').replace(/\D/g, '');
  if (only.length !== 8) {
    throw new BadRequestException(`CEP inválido: "${cep}". Deve ter 8 dígitos.`);
  }
  return only;
}

export interface TaxaInput {
  cepInicio?: string;
  cepFim?: string;
  nomeRegiao?: string | null;
  taxa?: number | string;
  valorMinGratis?: number | string | null;
  ativo?: boolean;
  ordem?: number;
}

@Injectable()
export class TaxasEntregaService {
  constructor(private prisma: PrismaService) {}

  findAll(empresaId: string) {
    return this.prisma.taxaEntregaCep.findMany({
      where: { empresaId },
      orderBy: [{ ordem: 'asc' }, { cepInicio: 'asc' }],
    });
  }

  async create(empresaId: string, dto: TaxaInput) {
    const cepInicio = sanitizeCep(dto.cepInicio);
    const cepFim = sanitizeCep(dto.cepFim);
    if (cepInicio > cepFim) {
      throw new BadRequestException('cep_inicio deve ser menor ou igual a cep_fim');
    }
    await this.validarSobreposicao(empresaId, cepInicio, cepFim, null);

    return this.prisma.taxaEntregaCep.create({
      data: {
        empresaId,
        cepInicio,
        cepFim,
        nomeRegiao: dto.nomeRegiao ?? null,
        taxa: Number(dto.taxa ?? 0),
        valorMinGratis:
          dto.valorMinGratis !== undefined && dto.valorMinGratis !== null && dto.valorMinGratis !== ''
            ? Number(dto.valorMinGratis)
            : null,
        ativo: dto.ativo ?? true,
        ordem: dto.ordem ?? 0,
      },
    });
  }

  async update(empresaId: string, id: string, dto: TaxaInput) {
    const existing = await this.prisma.taxaEntregaCep.findFirst({ where: { id, empresaId } });
    if (!existing) throw new NotFoundException('Taxa não encontrada');

    const cepInicio = dto.cepInicio !== undefined ? sanitizeCep(dto.cepInicio) : existing.cepInicio;
    const cepFim = dto.cepFim !== undefined ? sanitizeCep(dto.cepFim) : existing.cepFim;
    if (cepInicio > cepFim) {
      throw new BadRequestException('cep_inicio deve ser menor ou igual a cep_fim');
    }
    await this.validarSobreposicao(empresaId, cepInicio, cepFim, id);

    return this.prisma.taxaEntregaCep.update({
      where: { id },
      data: {
        cepInicio,
        cepFim,
        nomeRegiao: dto.nomeRegiao !== undefined ? dto.nomeRegiao : existing.nomeRegiao,
        taxa: dto.taxa !== undefined ? Number(dto.taxa) : existing.taxa,
        valorMinGratis:
          dto.valorMinGratis === null || dto.valorMinGratis === ''
            ? null
            : dto.valorMinGratis !== undefined
              ? Number(dto.valorMinGratis)
              : existing.valorMinGratis,
        ativo: dto.ativo !== undefined ? dto.ativo : existing.ativo,
        ordem: dto.ordem !== undefined ? dto.ordem : existing.ordem,
      },
    });
  }

  async delete(empresaId: string, id: string) {
    await this.prisma.taxaEntregaCep.deleteMany({ where: { id, empresaId } });
    return { deleted: true };
  }

  async resolve(empresaId: string, cep: string, subtotal: number) {
    const cepNormalizado = sanitizeCep(cep);
    const faixa = await this.prisma.taxaEntregaCep.findFirst({
      where: {
        empresaId,
        ativo: true,
        cepInicio: { lte: cepNormalizado },
        cepFim: { gte: cepNormalizado },
      },
      orderBy: [{ ordem: 'asc' }, { cepInicio: 'asc' }],
    });

    if (!faixa) {
      return {
        entrega: false,
        taxa: null,
        nomeRegiao: null,
        valorMinGratis: null,
        faltaParaGratis: null,
        motivo: 'CEP não cadastrado para entrega',
      };
    }

    const taxa = Number(faixa.taxa);
    const minGratis = faixa.valorMinGratis !== null ? Number(faixa.valorMinGratis) : null;
    const subtotalNum = Number(subtotal ?? 0);
    const gratis = minGratis !== null && subtotalNum >= minGratis;

    return {
      entrega: true,
      taxa: gratis ? 0 : taxa,
      taxaOriginal: taxa,
      nomeRegiao: faixa.nomeRegiao,
      valorMinGratis: minGratis,
      faltaParaGratis: minGratis !== null && !gratis ? Number((minGratis - subtotalNum).toFixed(2)) : null,
      gratis,
    };
  }

  private async validarSobreposicao(empresaId: string, inicio: string, fim: string, ignorarId: string | null) {
    const conflito = await this.prisma.taxaEntregaCep.findFirst({
      where: {
        empresaId,
        ativo: true,
        ...(ignorarId ? { NOT: { id: ignorarId } } : {}),
        cepInicio: { lte: fim },
        cepFim: { gte: inicio },
      },
    });
    if (conflito) {
      throw new BadRequestException(
        `Faixa sobrepõe outra já cadastrada: ${conflito.cepInicio} a ${conflito.cepFim}${
          conflito.nomeRegiao ? ` (${conflito.nomeRegiao})` : ''
        }`,
      );
    }
  }
}
