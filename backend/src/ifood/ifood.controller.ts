import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IfoodApiService } from './ifood-api.service';
import { IfoodCatalogService } from './ifood-catalog.service';
import { Roles } from '../common/decorators';
import {
  UpdateIfoodConfigDto,
  BulkIfoodStatusMappingDto,
  BulkHorariosDto,
} from './dto/ifood-config.dto';

@Controller('empresas/:empresaId/ifood')
export class IfoodController {
  constructor(
    private prisma: PrismaService,
    private ifoodApi: IfoodApiService,
    private catalogService: IfoodCatalogService,
  ) {}

  // ---- Config ----
  @Get('config')
  @Roles('admin')
  async getConfig(@Param('empresaId') empresaId: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: {
        ifoodMerchantId: true,
        ifoodClientId: true,
        ifoodClientSecret: true,
        ifoodAtivo: true,
        ifoodWebhookMode: true,
      },
    });
    return {
      ...empresa,
      // Mask secret for display
      ifoodClientSecret: empresa?.ifoodClientSecret
        ? '••••••••' + empresa.ifoodClientSecret.slice(-4)
        : null,
    };
  }

  @Put('config')
  @Roles('admin')
  async updateConfig(
    @Param('empresaId') empresaId: string,
    @Body() dto: UpdateIfoodConfigDto,
  ) {
    const data: any = {};
    if (dto.ifoodMerchantId !== undefined) data.ifoodMerchantId = dto.ifoodMerchantId;
    if (dto.ifoodClientId !== undefined) data.ifoodClientId = dto.ifoodClientId;
    if (dto.ifoodClientSecret !== undefined) data.ifoodClientSecret = dto.ifoodClientSecret;
    if (dto.ifoodWebhookMode !== undefined) data.ifoodWebhookMode = dto.ifoodWebhookMode;

    return this.prisma.empresa.update({ where: { id: empresaId }, data });
  }

  // ---- Activate / Deactivate ----
  @Post('activate')
  @Roles('admin')
  async activate(@Param('empresaId') empresaId: string) {
    await this.prisma.empresa.update({
      where: { id: empresaId },
      data: { ifoodAtivo: true },
    });

    // Seed PedidoTipoConfig for iFood
    await this.prisma.pedidoTipoConfig.upsert({
      where: { empresaId_tipoKey: { empresaId, tipoKey: 'ifood' } },
      update: { ativo: true },
      create: {
        empresaId,
        tipoKey: 'ifood',
        label: 'iFood',
        ativo: true,
        ordem: 10,
        origem: 'ifood',
        exigeEndereco: true,
      },
    });

    // Seed default status mappings
    const defaultMappings = [
      { localStatusKey: 'confirmado', ifoodAction: 'confirm' },
      { localStatusKey: 'preparo', ifoodAction: 'startPreparation' },
      { localStatusKey: 'pronto', ifoodAction: 'readyToPickup' },
      { localStatusKey: 'saiu_entrega', ifoodAction: 'dispatch' },
    ];

    for (const m of defaultMappings) {
      await this.prisma.ifoodStatusMapping.upsert({
        where: { empresaId_localStatusKey: { empresaId, localStatusKey: m.localStatusKey } },
        update: {},
        create: { empresaId, ...m },
      });
    }

    // Add "ifood" to tiposAplicaveis of all status configs
    const statusConfigs = await this.prisma.pedidoStatusConfig.findMany({ where: { empresaId } });
    for (const sc of statusConfigs) {
      if (!sc.tiposAplicaveis.includes('ifood')) {
        await this.prisma.pedidoStatusConfig.update({
          where: { id: sc.id },
          data: { tiposAplicaveis: [...sc.tiposAplicaveis, 'ifood'] },
        });
      }
    }

    // Create catalog sync tracker
    await this.prisma.ifoodCatalogSync.upsert({
      where: { empresaId },
      update: {},
      create: { empresaId },
    });

    return { activated: true };
  }

  @Post('deactivate')
  @Roles('admin')
  async deactivate(@Param('empresaId') empresaId: string) {
    await this.prisma.empresa.update({
      where: { id: empresaId },
      data: { ifoodAtivo: false },
    });
    return { activated: false };
  }

  // ---- Status Mappings ----
  @Get('status-mappings')
  @Roles('admin')
  async getStatusMappings(@Param('empresaId') empresaId: string) {
    return this.prisma.ifoodStatusMapping.findMany({ where: { empresaId } });
  }

  @Put('status-mappings')
  @Roles('admin')
  async updateStatusMappings(
    @Param('empresaId') empresaId: string,
    @Body() dto: BulkIfoodStatusMappingDto,
  ) {
    await this.prisma.ifoodStatusMapping.deleteMany({ where: { empresaId } });
    const created = [];
    for (const m of dto.mappings) {
      const item = await this.prisma.ifoodStatusMapping.create({
        data: { empresaId, localStatusKey: m.localStatusKey, ifoodAction: m.ifoodAction },
      });
      created.push(item);
    }
    return created;
  }

  // ---- Catalog Sync ----
  @Post('sync-catalog')
  @Roles('admin')
  async syncCatalog(@Param('empresaId') empresaId: string) {
    await this.catalogService.pushCatalog(empresaId);
    return { synced: true };
  }

  @Get('sync-status')
  @Roles('admin')
  async getSyncStatus(@Param('empresaId') empresaId: string) {
    return this.prisma.ifoodCatalogSync.findUnique({ where: { empresaId } });
  }

  // ---- Merchant Status ----
  @Get('merchant-status')
  @Roles('admin')
  async getMerchantStatus(@Param('empresaId') empresaId: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { ifoodMerchantId: true },
    });
    if (!empresa?.ifoodMerchantId) return { available: false };
    return this.ifoodApi.getMerchantStatus(empresaId, empresa.ifoodMerchantId);
  }

  @Put('merchant-status')
  @Roles('admin')
  async updateMerchantStatus(
    @Param('empresaId') empresaId: string,
    @Body('available') available: boolean,
  ) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { ifoodMerchantId: true },
    });
    if (!empresa?.ifoodMerchantId) return;
    await this.ifoodApi.updateMerchantStatus(empresaId, empresa.ifoodMerchantId, available);
    return { available };
  }
}

// ---- Horários (separado, útil para o sistema geral) ----
@Controller('empresas/:empresaId/horarios')
export class HorariosController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll(@Param('empresaId') empresaId: string) {
    return this.prisma.horarioFuncionamento.findMany({
      where: { empresaId },
      orderBy: { diaSemana: 'asc' },
    });
  }

  @Put()
  @Roles('admin')
  async bulkUpsert(
    @Param('empresaId') empresaId: string,
    @Body() dto: BulkHorariosDto,
  ) {
    const result = [];
    for (const h of dto.horarios) {
      const item = await this.prisma.horarioFuncionamento.upsert({
        where: { empresaId_diaSemana: { empresaId, diaSemana: h.diaSemana } },
        update: { horaAbrir: h.horaAbrir, horaFechar: h.horaFechar, ativo: h.ativo ?? true },
        create: { empresaId, diaSemana: h.diaSemana, horaAbrir: h.horaAbrir, horaFechar: h.horaFechar, ativo: h.ativo ?? true },
      });
      result.push(item);
    }
    return result;
  }
}
