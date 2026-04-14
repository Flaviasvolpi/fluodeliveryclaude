import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { IfoodApiService } from './ifood-api.service';

@Injectable()
export class IfoodCatalogService {
  constructor(
    private prisma: PrismaService,
    private ifoodApi: IfoodApiService,
  ) {}

  @OnEvent('produto.changed')
  async handleProdutoChanged(event: { empresaId: string }): Promise<void> {
    await this.markPendingSync(event.empresaId);
  }

  async markPendingSync(empresaId: string): Promise<void> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { ifoodAtivo: true },
    });
    if (!empresa?.ifoodAtivo) return;

    await this.prisma.ifoodCatalogSync.upsert({
      where: { empresaId },
      update: { pendingSync: true },
      create: { empresaId, pendingSync: true },
    });
  }

  async pushCatalog(empresaId: string): Promise<void> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { ifoodMerchantId: true, ifoodAtivo: true },
    });

    if (!empresa?.ifoodAtivo || !empresa.ifoodMerchantId) return;

    try {
      // Fetch all active catalog data
      const [categorias, produtos] = await Promise.all([
        this.prisma.categoria.findMany({
          where: { empresaId, ativo: true },
          orderBy: { ordem: 'asc' },
        }),
        this.prisma.produto.findMany({
          where: { empresaId, ativo: true },
          include: {
            variantes: { where: { ativo: true }, orderBy: { ordem: 'asc' } },
            ingredientes: { where: { ativo: true }, orderBy: { ordem: 'asc' } },
            adicionaisGrupos: {
              include: {
                grupo: { include: { itens: { where: { ativo: true } } } },
              },
            },
          },
          orderBy: { ordem: 'asc' },
        }),
      ]);

      // Build iFood catalog payload
      const catalogItems = produtos.map((p) => ({
        externalCode: p.ifoodProductId || p.id,
        name: p.nome,
        description: p.descricao || '',
        imagePath: p.imagemUrl || '',
        categoryExternalCode: p.categoriaId
          ? (categorias.find((c) => c.id === p.categoriaId)?.ifoodCategoryId || p.categoriaId)
          : undefined,
        price: {
          value: p.possuiVariantes ? 0 : Number(p.precoBase ?? 0) * 100, // centavos
        },
        shifts: [{ startTime: '00:00', endTime: '23:59' }],
        modifiers: p.adicionaisGrupos.map((ag) => ({
          externalCode: ag.grupo.ifoodGroupId || ag.grupo.id,
          name: ag.grupo.nome,
          minQuantity: ag.grupo.minSelect,
          maxQuantity: ag.grupo.maxSelect,
          options: ag.grupo.itens.map((item) => ({
            externalCode: item.ifoodOptionId || item.id,
            name: item.nome,
            price: { value: Number(item.preco) * 100 },
          })),
        })),
      }));

      const catalogCategories = categorias.map((c) => ({
        externalCode: c.ifoodCategoryId || c.id,
        name: c.nome,
        order: c.ordem,
      }));

      const payload = { categories: catalogCategories, items: catalogItems };

      await this.ifoodApi.pushCatalog(empresaId, empresa.ifoodMerchantId, payload);

      // Store iFood IDs back if they were generated
      // (in practice, iFood may return IDs in the response that we should save)

      // Update sync status
      await this.prisma.ifoodCatalogSync.upsert({
        where: { empresaId },
        update: { lastSyncAt: new Date(), lastStatus: 'success', lastError: null, pendingSync: false },
        create: { empresaId, lastSyncAt: new Date(), lastStatus: 'success', pendingSync: false },
      });
    } catch (err) {
      await this.prisma.ifoodCatalogSync.upsert({
        where: { empresaId },
        update: { lastStatus: 'error', lastError: err.message, pendingSync: true },
        create: { empresaId, lastStatus: 'error', lastError: err.message, pendingSync: true },
      });
      throw err;
    }
  }
}
