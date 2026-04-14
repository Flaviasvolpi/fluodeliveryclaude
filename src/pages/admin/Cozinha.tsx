import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useEmpresa } from "@/contexts/EmpresaContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBRL, formatTime } from "@/lib/format";
import { toast } from "sonner";
import { ChefHat, CheckCircle2 } from "lucide-react";
import { useStatusConfig, getActiveStatuses, getStatusClasses, getNextStatusForTipo } from "@/hooks/useStatusConfig";
import { useTiposConfig } from "@/hooks/useTiposConfig";

export default function Cozinha() {
  const { empresaId } = useEmpresa();
  const qc = useQueryClient();
  const { data: statusConfigs } = useStatusConfig(empresaId);
  const { data: tiposConfig } = useTiposConfig(empresaId);

  const activeKeys = statusConfigs
    ? getActiveStatuses(statusConfigs)
        .filter((s) => ["confirmado", "preparo"].includes(s.status_key))
        .map((s) => s.status_key)
    : ["confirmado", "preparo"];

  const { data: pedidos } = useQuery({
    queryKey: ["cozinha-pedidos", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/pedidos`);
      return data;
    },
    refetchInterval: 5000,
  });

  const confirmadoConfig = statusConfigs?.find((c) => c.status_key === "confirmado");
  const preparoConfig = statusConfigs?.find((c) => c.status_key === "preparo");

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/empresas/${empresaId}/pedidos/${id}`, { pedido_status: status });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cozinha-pedidos", empresaId] });
      toast.success("Status atualizado!");
    },
  });

  function advanceStatus(pedido: any) {
    if (!statusConfigs) return;
    const next = getNextStatusForTipo(statusConfigs, pedido.pedido_status, pedido.tipo);
    if (next) {
      updateStatus.mutate({ id: pedido.id, status: next });
    }
  }

  function getNextLabel(pedido: any): string | null {
    if (!statusConfigs) return null;
    const next = getNextStatusForTipo(statusConfigs, pedido.pedido_status, pedido.tipo);
    if (!next) return null;
    return statusConfigs.find((c) => c.status_key === next)?.label ?? next;
  }

  function getTipoLabel(tipo: string): string {
    return tiposConfig?.find((t) => t.tipo_key === tipo)?.label ?? tipo;
  }

  const preparoOrders = pedidos?.filter((p) => p.pedido_status === "preparo") ?? [];
  const confirmadoOrders = pedidos?.filter((p) => p.pedido_status === "confirmado") ?? [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ChefHat className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">Cozinha</h2>
        </div>
        {confirmadoOrders.length > 0 && activeKeys.includes("confirmado") && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-muted-foreground">
              {confirmadoConfig?.label ?? "Aguardando Preparo"} ({confirmadoOrders.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {confirmadoOrders.map((p: any) => (
                <Card key={p.id} className="border-yellow-500/30">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between">
                      <div>
                        <span className="text-xl font-bold">#{p.numero_sequencial}</span>
                        <Badge variant="outline" className="ml-2">{getTipoLabel(p.tipo)}</Badge>
                        {p.tipo === "mesa" && p.mesa && <Badge variant="outline" className="ml-1">🍽 {(p.mesa as any).nome}</Badge>}
                        {p.referencia && <Badge variant="outline" className="ml-1">#{p.referencia}</Badge>}
                      </div>
                      <span className="text-sm text-muted-foreground">{formatTime(p.created_at)}</span>
                    </div>
                    <div className="space-y-1">
                      {p.itens?.map((item: any) => (
                        <div key={item.id} className="text-sm">
                          <span className="font-medium">{item.qtd}x {item.nome_snapshot}</span>
                          {item.variante_nome_snapshot && <span className="text-muted-foreground"> ({item.variante_nome_snapshot})</span>}
                          {item.adicionais?.length > 0 && (
                            <p className="text-xs text-muted-foreground pl-4">+ {item.adicionais.map((a: any) => a.nome_snapshot).join(", ")}</p>
                          )}
                          {item.observacao_item && <p className="text-xs italic text-muted-foreground pl-4">Obs: {item.observacao_item}</p>}
                        </div>
                      ))}
                    </div>
                    <Button className="w-full" onClick={() => advanceStatus(p)}>
                      {getNextLabel(p) ? `Iniciar ${getNextLabel(p)}` : "Avançar"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-orange-400">
            {preparoConfig?.label ?? "Em Preparo"} ({preparoOrders.length})
          </h3>
          {preparoOrders.length === 0 ? (
            <p className="text-muted-foreground">Nenhum pedido em preparo.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {preparoOrders.map((p: any) => (
                <Card key={p.id} className="border-orange-500/30">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between">
                       <div>
                         <span className="text-xl font-bold">#{p.numero_sequencial}</span>
                         <Badge variant="outline" className="ml-2">{getTipoLabel(p.tipo)}</Badge>
                         {p.tipo === "mesa" && p.mesa && <Badge variant="outline" className="ml-1">🍽 {(p.mesa as any).nome}</Badge>}
                         {p.referencia && <Badge variant="outline" className="ml-1">#{p.referencia}</Badge>}
                       </div>
                       <Badge className={getStatusClasses(preparoConfig?.cor ?? "orange")}>
                         {preparoConfig?.label ?? "Preparo"}
                       </Badge>
                     </div>
                    <div className="space-y-1">
                      {p.itens?.map((item: any) => (
                        <div key={item.id} className="text-sm">
                          <span className="font-medium">{item.qtd}x {item.nome_snapshot}</span>
                          {item.variante_nome_snapshot && <span className="text-muted-foreground"> ({item.variante_nome_snapshot})</span>}
                          {item.adicionais?.length > 0 && (
                            <p className="text-xs text-muted-foreground pl-4">+ {item.adicionais.map((a: any) => a.nome_snapshot).join(", ")}</p>
                          )}
                          {item.observacao_item && <p className="text-xs italic text-muted-foreground pl-4">Obs: {item.observacao_item}</p>}
                        </div>
                      ))}
                    </div>
                    <Button className="w-full gap-2" variant="default" onClick={() => advanceStatus(p)}>
                      <CheckCircle2 className="h-4 w-4" />
                      {getNextLabel(p) ? `Marcar como ${getNextLabel(p)}` : "Avançar"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
