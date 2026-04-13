import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBRL, formatDate } from "@/lib/format";
import { ArrowLeft, Phone, ShoppingBag, TrendingUp } from "lucide-react";
import { CLASSIFICACAO_LABELS, CLASSIFICACAO_COLORS, type Classificacao } from "@/hooks/useClienteClassificacao";

interface ClienteData {
  id: string;
  nome: string;
  telefone: string;
  total_pedidos: number;
  total_gasto: number;
  ultimo_pedido: string | null;
}

interface Props {
  cliente: ClienteData;
  classificacao: Classificacao;
  onBack: () => void;
}

export default function ClienteDetalhe({ cliente, classificacao, onBack }: Props) {
  const { empresaId } = useEmpresa();

  const { data: clientePedidos } = useQuery({
    queryKey: ["admin-cliente-pedidos", cliente.id],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/pedidos`, { params: { cliente_id: cliente.id } });
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <h2 className="text-2xl font-bold">{cliente.nome}</h2>
        <Badge variant="outline" className={`text-xs ${CLASSIFICACAO_COLORS[classificacao]}`}>
          {CLASSIFICACAO_LABELS[classificacao]}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Phone className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Telefone</p>
              <p className="font-medium text-sm">{cliente.telefone}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Pedidos</p>
              <p className="font-medium text-sm">{cliente.total_pedidos}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Total gasto</p>
              <p className="font-medium text-sm">{formatBRL(cliente.total_gasto)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Ticket médio</p>
              <p className="font-medium text-sm">
                {cliente.total_pedidos > 0 ? formatBRL(cliente.total_gasto / cliente.total_pedidos) : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Pedidos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!clientePedidos?.length ? (
            <p className="text-muted-foreground text-sm p-4">Nenhum pedido encontrado.</p>
          ) : (
            <div className="divide-y">
              {clientePedidos.map((p: any) => (
                <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">#{p.numero_sequencial}</span>
                      <Badge variant="outline" className="text-xs">{p.tipo}</Badge>
                      <Badge variant="secondary" className="text-xs">{p.pedido_status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                      {p.pedido_itens?.map((item: any, idx: number) => (
                        <p key={idx}>
                          {item.qtd}x {item.nome_snapshot}
                          {item.variante_nome_snapshot && ` (${item.variante_nome_snapshot})`}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-primary text-sm">{formatBRL(p.total)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(p.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
