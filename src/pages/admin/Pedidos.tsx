import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useEmpresa } from "@/contexts/EmpresaContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Printer } from "lucide-react";
import { formatBRL, formatTime } from "@/lib/format";
import { toast } from "sonner";
import CupomPedido from "@/components/admin/CupomPedido";
import SelecionarEntregadorDialog from "@/components/admin/SelecionarEntregadorDialog";
import {
  useStatusConfig,
  getActiveStatuses,
  getActiveStatusesForTipo,
  getNextStatusForTipo,
  getStatusClasses,
} from "@/hooks/useStatusConfig";
import { useTiposConfig, getActiveTipos } from "@/hooks/useTiposConfig";

export default function Pedidos() {
  const { empresaId } = useEmpresa();
  const qc = useQueryClient();
  const [printPedido, setPrintPedido] = useState<any | null>(null);
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [entregadorDialog, setEntregadorDialog] = useState<{ pedidoId: string; nextStatus: string } | null>(null);
  const { data: statusConfigs } = useStatusConfig(empresaId);
  const { data: tiposConfig } = useTiposConfig(empresaId);

  const activeTipos = tiposConfig ? getActiveTipos(tiposConfig) : [];

  const { data: pedidos } = useQuery({
    queryKey: ["admin-pedidos", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/pedidos`);
      return data;
    },
    refetchInterval: 10000,
  });

  const kanbanStatuses = statusConfigs
    ? filterTipo === "todos"
      ? getActiveStatuses(statusConfigs)
      : getActiveStatusesForTipo(statusConfigs, filterTipo)
    : [];

  const kanbanColumns = kanbanStatuses.filter((s) => s.status_key !== "entregue");

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, entregador_id }: { id: string; status: string; entregador_id?: string }) => {
      const update: any = { pedido_status: status };
      if (entregador_id) update.entregador_id = entregador_id;
      await api.patch(`/empresas/${empresaId}/pedidos/${id}`, update);
      return { id, status };
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["admin-pedidos", empresaId] });
      toast.success("Status atualizado!");
      if (variables.status === "confirmado") {
        const pedido = pedidos?.find((p) => p.id === variables.id);
        if (pedido) setPrintPedido(pedido);
      }
    },
  });

  function getNextStatus(pedido: any): string | null {
    if (!statusConfigs) return null;
    return getNextStatusForTipo(statusConfigs, pedido.pedido_status, pedido.tipo);
  }

  const filteredPedidos = pedidos?.filter((p) => filterTipo === "todos" || p.tipo === filterTipo);

  function getTipoLabel(tipo: string): string {
    const found = tiposConfig?.find((t) => t.tipo_key === tipo);
    return found?.label ?? tipo;
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-2xl font-bold">Pedidos</h2>
          <Tabs value={filterTipo} onValueChange={setFilterTipo}>
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              {activeTipos.map((t) => (
                <TabsTrigger key={t.tipo_key} value={t.tipo_key}>{t.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map((col) => {
            const columnPedidos = filteredPedidos?.filter((p) => p.pedido_status === col.status_key) ?? [];
            return (
              <div key={col.status_key} className="min-w-[280px] flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={getStatusClasses(col.cor)}>{col.label}</Badge>
                  <span className="text-sm text-muted-foreground">({columnPedidos.length})</span>
                </div>
                <div className="space-y-3">
                  {columnPedidos.map((p: any) => {
                    const next = getNextStatus(p);
                    const nextLabel = next && statusConfigs
                      ? statusConfigs.find((s) => s.status_key === next)?.label ?? next
                      : null;
                    return (
                      <Card key={p.id}>
                        <CardContent className="p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold">#{p.numero_sequencial}</span>
                              <p className="text-sm">{p.cliente_nome}</p>
                              <Badge variant="outline" className="text-xs mt-0.5">{getTipoLabel(p.tipo)}</Badge>
                              {p.tipo === "mesa" && p.mesa && (
                                <Badge variant="outline" className="text-xs mt-0.5 ml-1">🍽 {(p.mesa as any).nome}</Badge>
                              )}
                              {p.referencia && (
                                <Badge variant="outline" className="text-xs mt-0.5 ml-1">#{p.referencia}</Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{formatTime(p.created_at)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            {p.itens?.map((item: any) => (
                              <p key={item.id}>{item.qtd}x {item.nome_snapshot}{item.variante_nome_snapshot && ` (${item.variante_nome_snapshot})`}</p>
                            ))}
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="font-semibold text-primary text-sm">{formatBRL(p.total)}</span>
                            <div className="flex items-center gap-1">
                              {next && nextLabel && (
                                <Button size="sm" variant="default" onClick={() => {
                                  if (next === "saiu_entrega" && p.tipo === "entrega") {
                                    setEntregadorDialog({ pedidoId: p.id, nextStatus: next });
                                  } else {
                                    updateStatus.mutate({ id: p.id, status: next });
                                  }
                                }} disabled={updateStatus.isPending}>
                                  {nextLabel}
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Imprimir cupom" onClick={() => setPrintPedido(p)}>
                                <Printer className="h-3.5 w-3.5" />
                              </Button>
                              {col.status_key !== "cancelado" && col.status_key !== "entregue" && (
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" title="Cancelar pedido" onClick={() => updateStatus.mutate({ id: p.id, status: "cancelado" })}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <CupomPedido pedido={printPedido} open={!!printPedido} onOpenChange={(open) => { if (!open) setPrintPedido(null); }} />
      <SelecionarEntregadorDialog
        empresaId={empresaId}
        open={!!entregadorDialog}
        onOpenChange={(open) => { if (!open) setEntregadorDialog(null); }}
        onConfirm={(entregadorId) => {
          if (entregadorDialog) {
            updateStatus.mutate(
              { id: entregadorDialog.pedidoId, status: entregadorDialog.nextStatus, entregador_id: entregadorId },
              { onSuccess: () => setEntregadorDialog(null) }
            );
          }
        }}
        loading={updateStatus.isPending}
      />
    </AdminLayout>
  );
}
