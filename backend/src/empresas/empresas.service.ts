import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmpresaDto, UpdateEmpresaDto } from './dto/create-empresa.dto';

@Injectable()
export class EmpresasService {
  constructor(private prisma: PrismaService) {}

  async findBySlugSafe(slug: string) {
    return this.prisma.empresa.findUnique({ where: { slug }, select: { id: true } });
  }

  async findBySlug(slug: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { slug },
      select: {
        id: true, nome: true, slug: true, telefone: true,
        logoUrl: true, bannerUrl: true, ativo: true, createdAt: true,
      },
    });
    if (!empresa) throw new NotFoundException('Empresa não encontrada');
    return empresa;
  }

  async findById(id: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id },
      select: {
        id: true, nome: true, slug: true, telefone: true,
        logoUrl: true, bannerUrl: true, ativo: true, createdAt: true,
      },
    });
    if (!empresa) throw new NotFoundException('Empresa não encontrada');
    return empresa;
  }

  async findByUserId(userId: string) {
    const roles = await this.prisma.userRole.findMany({
      where: { userId },
      select: {
        role: true,
        empresa: {
          select: { id: true, nome: true, slug: true, ativo: true },
        },
      },
    });
    const empresaMap = new Map<string, { id: string; nome: string; slug: string; ativo: boolean; roles: string[] }>();
    for (const r of roles) {
      const existing = empresaMap.get(r.empresa.id);
      if (existing) {
        existing.roles.push(r.role);
      } else {
        empresaMap.set(r.empresa.id, { ...r.empresa, roles: [r.role] });
      }
    }
    return Array.from(empresaMap.values());
  }

  async create(dto: CreateEmpresaDto) {
    const empresa = await this.prisma.empresa.create({ data: dto });
    await this.prisma.empresaContador.create({ data: { empresaId: empresa.id } });
    return empresa;
  }

  async update(id: string, dto: UpdateEmpresaDto) {
    return this.prisma.empresa.update({ where: { id }, data: dto });
  }

  async getApiKey(empresaId: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { apiKey: true },
    });
    return { apiKey: empresa?.apiKey };
  }

  async regenerateApiKey(empresaId: string) {
    const empresa = await this.prisma.empresa.update({
      where: { id: empresaId },
      data: { apiKey: crypto.randomUUID() },
      select: { apiKey: true },
    });
    return { apiKey: empresa.apiKey };
  }
}
