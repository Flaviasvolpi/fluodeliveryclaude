import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, ShoppingCart } from "lucide-react";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { formatBRL } from "@/lib/format";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import type { CartItem } from "@/types/cart";

const BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/v1/cliente-auth`;

interface PedidoItemAdicional {
  adicional_item_id: string | null;
  nome_snapshot: string;
  preco_snapshot: number;
  qtd: number;
}

interface PedidoItem {
  nome_snapshot: string;
  qtd: number;
  preco_unit_snapshot: number;
  custo_unit_snapshot: number;
  produto_id: string | null;
  produto_variante_id: string | null;
  variante_nome_snapshot: string | null;
  observacao_item: string | null;
  adicionais: PedidoItemAdicional[];
}

interface Pedido {
  id: string;
  numero_sequencial: number;
  created_at: string;
  total: number;
  pedido_status: string;
  tipo: string;
  itens: PedidoItem[];
}

export default function MeusPedidos({ clienteId }: { clienteId: string }) {
  const { empresaId, slug } = useEmpresa();
  const { addItem } = useCart();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/meus-pedidos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cliente_id: clienteId, empresa_id: empresaId }),
        });
        const data = await res.json();
        setPedidos(data.pedidos || []);
      } catch {
        toast.error("Erro ao carregar pedidos");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [clienteId, empresaId]);

  const handleRepetir = (pedido: Pedido) => {
    if (!pedido.itens || pedido.itens.length === 0) {
      toast.error("Pedido sem itens para repetir");
      return;
    }

    let addedCount = 0;
    for (const item of pedido.itens) {
      if (!item.produto_id) continue;

      const cartItem: CartItem = {
        id: crypto.randomUUID(),
        produto_id: item.produto_id,
        produto_nome: item.nome_snapshot,
        variante_id: item.produto_variante_id,
        variante_nome: item.variante_nome_snapshot,
        preco_unit: item.preco_unit_snapshot,
        custo_unit: item.custo_unit_snapshot || 0,
        qtd: item.qtd,
        observacao: item.observacao_item || undefined,
        adicionais: (item.adicionais || []).map((a) => ({
          adicional_item_id: a.adicional_item_id || "",
          nome: a.nome_snapshot,
          preco: a.preco_snapshot,
          qtd: a.qtd,
        })),
      };
      addItem(cartItem);
      addedCount++;
    }

    if (addedCount > 0) {
      toast.success(`${addedCount} item(ns) adicionado(s) ao carrinho`, {
        action: {
          label: "Ver carrinho",
          onClick: () => navigate(`/loja/${slug}/carrinho`),
        },
      });
    } else {
      toast.error("Não foi possível repetir este pedido");
    }
  };

  if (loading) return <p className="text-center text-muted-foreground py-8">Carregando...</p>;
  if (pedidos.length === 0) return <p className="text-center text-muted-foreground py-8">Nenhum pedido encontrado.</p>;

  return (
    <div className="space-y-3">
      {pedidos.map((p) => (
        <Card key={p.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary">#{p.numero_sequencial}</span>
                <Badge variant="secondary" className="text-xs">{p.pedido_status}</Badge>
                <Badge variant="outline" className="text-xs">{p.tipo}</Badge>
              </div>
              <span className="font-semibold">{formatBRL(p.total)}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {format(new Date(p.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
            <ul className="text-sm space-y-0.5 text-muted-foreground mb-3">
              {p.itens?.map((item, i) => (
                <li key={i}>{item.qtd}x {item.nome_snapshot}</li>
              ))}
            </ul>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 w-full"
              onClick={() => handleRepetir(p)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Repetir pedido
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
