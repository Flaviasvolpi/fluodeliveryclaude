import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useEmpresa } from "@/contexts/EmpresaContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatBRL } from "@/lib/format";
import { toast } from "sonner";
import { Truck, Clock } from "lucide-react";

function getBairro(endereco: any): string {
  if (!endereco) return "Sem bairro";
  if (typeof endereco === "string") {
    try { endereco = JSON.parse(endereco); } catch { return "Sem bairro"; }
  }
  return endereco.bairro || endereco.neighborhood || "Sem bairro";
}

function tempoEspera(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min`;
  return `${Math.floor(mins / 60)}h${mins % 60}min`;
}

export default function GestaoEntregas() {
  const { empresaId } = useEmpresa();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [entregadorId, setEntregadorId] = useState<string>("");

  const { data: pedidos } = useQuery({
    queryKey: ["gestao-entregas", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/pedidos`);
      return data;
    },
    refetchInterval: 10000,
  });

  const { data: entregadores } = useQuery({
    queryKey: ["entregadores-ativos", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/entregadores`);
      return data;
    },
  });

  const despachar = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selected);
      for (const id of ids) {
        await api.patch(`/empresas/${empresaId}/pedidos/${id}`, {
          entregador_id: entregadorId,
          pedido_status: "saiu_entrega",
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gestao-entregas", empresaId] });
      qc.invalidateQueries({ queryKey: ["admin-pedidos", empresaId] });
      setSelected(new Set());
      setEntregadorId("");
      toast.success("Entregas despachadas!");
    },
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (pedidos && selected.size === pedidos.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pedidos?.map((p) => p.id)));
    }
  };

  // Group by bairro
  const grouped = (pedidos ?? []).reduce((acc: Record<string, typeof pedidos>, p: any) => {
    const b = getBairro(p.endereco);
    (acc[b] ??= []).push(p);
    return acc;
  }, {});

  const bairros = Object.keys(grouped).sort();

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Truck className="h-6 w-6" />Gestão de Entregas</h2>
          <div className="flex items-center gap-2">
            <Select value={entregadorId} onValueChange={setEntregadorId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Entregador" />
              </SelectTrigger>
              <SelectContent>
                {entregadores?.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              disabled={selected.size === 0 || !entregadorId || despachar.isPending}
              onClick={() => despachar.mutate()}
            >
              {despachar.isPending ? "Despachando..." : `Despachar (${selected.size})`}
            </Button>
          </div>
        </div>

        {pedidos && pedidos.length > 0 && (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selected.size === pedidos.length && pedidos.length > 0}
              onCheckedChange={selectAll}
            />
            <span className="text-sm text-muted-foreground">Selecionar todos ({pedidos.length})</span>
          </div>
        )}

        {pedidos?.length === 0 && (
          <p className="text-muted-foreground text-center py-12">Nenhuma entrega pronta no momento.</p>
        )}

        {bairros.map((bairro) => (
          <div key={bairro} className="space-y-2">
            <h3 className="text-lg font-semibold">{bairro}</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {grouped[bairro]!.map((p: any) => (
                <Card
                  key={p.id}
                  className={`cursor-pointer transition-all ${selected.has(p.id) ? "ring-2 ring-primary" : ""}`}
                  onClick={() => toggleSelect(p.id)}
                >
                  <CardContent className="p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
                        <span className="font-bold">#{p.numero_sequencial}</span>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />{tempoEspera(p.created_at)}
                      </Badge>
                    </div>
                    <p className="text-sm">{p.cliente_nome}</p>
                    {p.endereco && (
                      <p className="text-xs text-muted-foreground">
                        {typeof p.endereco === "object" ? (p.endereco as any).rua || (p.endereco as any).logradouro || "" : ""}
                        {typeof p.endereco === "object" && (p.endereco as any).numero ? `, ${(p.endereco as any).numero}` : ""}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-semibold text-primary text-sm">{formatBRL(p.total)}</span>
                      {p.pagar_na_entrega && <Badge variant="destructive" className="text-xs">Pagar na entrega</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
