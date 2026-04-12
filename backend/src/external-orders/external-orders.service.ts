import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PedidosService } from '../pedidos/pedidos.service';
import { CreateExternalOrderDto } from './dto/external-order.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExternalOrdersService {
  constructor(
    private prisma: PrismaService,
    private pedidosService: PedidosService,
  ) {}

  async criarPedidoExterno(empresaId: string, dto: CreateExternalOrderDto) {
    // Calculate totals from items
    let subtotal = 0;
    const itens = dto.itens.map((item) => {
      let itemTotal = item.preco * item.qtd;
      const adicionais = (item.adicionais || []).map((a) => {
        itemTotal += a.preco * (a.qtd ?? 1);
        return {
          nomeSnapshot: a.nome,
          precoSnapshot: a.preco,
          qtd: a.qtd ?? 1,
        };
      });
      subtotal += itemTotal;

      return {
        nomeSnapshot: item.nome,
        varianteNomeSnapshot: item.variante,
        precoUnitSnapshot: item.preco,
        custoUnitSnapshot: 0,
        qtd: item.qtd,
        observacaoItem: item.observacao,
        adicionais,
      };
    });

    const numero = await this.pedidosService.criarPedido(empresaId, {
      clienteNome: dto.clienteNome,
      clienteTelefone: dto.clienteTelefone,
      tipo: dto.tipo || 'retirada',
      subtotal,
      observacoes: dto.observacoes,
      itens,
    });

    return { numeroPedido: numero };
  }

  async consultarPedidos(empresaId: string, telefone?: string, numero?: number, status?: string) {
    const where: Prisma.PedidoWhereInput = { empresaId };
    if (telefone) where.clienteTelefone = telefone;
    if (numero) where.numeroSequencial = numero;
    if (status) where.pedidoStatus = status;

    return this.prisma.pedido.findMany({
      where,
      select: {
        id: true, numeroSequencial: true, createdAt: true,
        clienteNome: true, total: true, pedidoStatus: true, tipo: true,
        itens: {
          select: { nomeSnapshot: true, qtd: true, precoUnitSnapshot: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
