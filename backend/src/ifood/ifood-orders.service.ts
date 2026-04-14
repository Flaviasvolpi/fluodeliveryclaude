import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PedidosService } from '../pedidos/pedidos.service';
import { IfoodApiService } from './ifood-api.service';

@Injectable()
export class IfoodOrdersService {
  constructor(
    private prisma: PrismaService,
    private pedidosService: PedidosService,
    private ifoodApi: IfoodApiService,
  ) {}

  async ingestOrder(empresaId: string, ifoodOrderId: string): Promise<void> {
    // 1. Check duplicate
    const existing = await this.prisma.pedido.findFirst({
      where: { empresaId, ifoodOrderId },
    });
    if (existing) return;

    // 2. Fetch order details from iFood
    const order = await this.ifoodApi.getOrderDetails(empresaId, ifoodOrderId);

    // 3. Map items — lookup local products by ifoodProductId
    const itens = await Promise.all(
      (order.items ?? []).map(async (item: any) => {
        // Try to find local product by externalCode or ifoodProductId
        let produto: any = null;
        if (item.externalCode) {
          produto = await this.prisma.produto.findFirst({
            where: { empresaId, ifoodProductId: item.externalCode },
          });
        }
        if (!produto && item.id) {
          produto = await this.prisma.produto.findFirst({
            where: { empresaId, ifoodProductId: item.id },
          });
        }

        // Map options (adicionais)
        const adicionais = await Promise.all(
          (item.options ?? []).map(async (opt: any) => {
            let adicionalItem: any = null;
            if (opt.externalCode) {
              adicionalItem = await this.prisma.adicionaisItem.findFirst({
                where: { empresaId, ifoodOptionId: opt.externalCode },
              });
            }
            return {
              adicionalItemId: adicionalItem?.id ?? null,
              nomeSnapshot: opt.name,
              precoSnapshot: (opt.unitPrice ?? opt.price ?? 0) / 100,
              qtd: opt.quantity ?? 1,
            };
          }),
        );

        return {
          produtoId: produto?.id ?? null,
          nomeSnapshot: item.name,
          precoUnitSnapshot: (item.unitPrice ?? 0) / 100,
          custoUnitSnapshot: produto ? Number(produto.custoBase ?? 0) : 0,
          qtd: item.quantity ?? 1,
          observacaoItem: item.observations ?? null,
          adicionais,
        };
      }),
    );

    // 4. Build address from iFood delivery info
    const address = order.delivery?.deliveryAddress;
    const endereco = address
      ? {
          rua: address.streetName ?? address.street ?? '',
          numero: address.streetNumber ?? address.number ?? '',
          bairro: address.neighborhood ?? '',
          complemento: address.complement ?? '',
          referencia: address.reference ?? '',
          cidade: address.city ?? '',
          estado: address.state ?? '',
          cep: address.postalCode ?? '',
          latitude: address.coordinates?.latitude ?? null,
          longitude: address.coordinates?.longitude ?? null,
        }
      : null;

    // 5. Calculate subtotal from items
    let subtotal = 0;
    for (const item of itens) {
      subtotal += item.precoUnitSnapshot * item.qtd;
      for (const a of item.adicionais) {
        subtotal += a.precoSnapshot * a.qtd;
      }
    }

    const taxaEntrega = (order.total?.deliveryFee ?? order.delivery?.deliveryFee ?? 0) / 100;
    const desconto = (order.total?.discount ?? 0) / 100;
    const benefits = (order.total?.benefits ?? 0) / 100;

    // 6. Create order via existing pipeline
    const numero = await this.pedidosService.criarPedido(empresaId, {
      clienteNome: order.customer?.name ?? 'Cliente iFood',
      clienteTelefone: order.customer?.phone?.number ?? order.customer?.phone ?? null,
      tipo: 'ifood',
      endereco,
      subtotal,
      taxaEntrega,
      desconto: desconto + benefits,
      observacoes: order.observations ?? null,
      itens,
    } as any);

    // 7. Update pedido with iFood references
    await this.prisma.pedido.updateMany({
      where: { empresaId, numeroSequencial: numero },
      data: {
        ifoodOrderId: order.id,
        ifoodDisplayId: order.displayId ?? order.code ?? null,
      },
    });

    // 8. Auto-confirm on iFood
    try {
      await this.ifoodApi.confirmOrder(empresaId, ifoodOrderId);
    } catch (err) {
      console.error(`[iFood] Failed to confirm order ${ifoodOrderId}:`, err.message);
    }
  }
}
