import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

import { useEmpresa } from "@/contexts/EmpresaContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { formatDate, formatBRL } from "@/lib/format";
import { useTiposConfig, getActiveTipos, type TipoConfig } from "@/hooks/useTiposConfig";
import type { PedidoStatus } from "@/types/database";
import { ClipboardList, Clock, ChefHat, CheckCircle2, Truck, Package, UtensilsCrossed, MapPin, HandPlatter, TicketCheck, ShoppingBag, DollarSign, Receipt, ArrowRight, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

const tipoIcons: Record<string, LucideIcon> = {
  retirada: HandPlatter,
  entrega: Truck,
  mesa: UtensilsCrossed,
  comanda: TicketCheck,
  balcao: MapPin,
};

const tipoColors: Record<string, string> = {
  retirada: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  entrega: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  mesa: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  comanda: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  balcao: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
};

const statusConfig: Record<PedidoStatus, { label: string; icon: React.ElementType; color: string }> = {
  novo: { label: "Novos", icon: ClipboardList, color: "text-blue-400" },
  confirmado: { label: "Confirmados", icon: Clock, color: "text-yellow-400" },
  preparo: { label: "Em Preparo", icon: ChefHat, color: "text-orange-400" },
  pronto: { label: "Prontos", icon: CheckCircle2, color: "text-green-400" },
  saiu_entrega: { label: "Saiu p/ Entrega", icon: Truck, color: "text-purple-400" },
  entregue: { label: "Entregues", icon: Package, color: "text-muted-foreground" },
  cancelado: { label: "Cancelados", icon: ClipboardList, color: "text-destructive" },
};

const INACTIVE_STATUSES = ["entregue", "cancelado"];

export default function Dashboard() {
  const { empresaId, slug } = useEmpresa();
  const { data: tiposConfig } = useTiposConfig(empresaId);

  const { data: pedidos } = useQuery({
    queryKey: ["admin-pedidos-dashboard", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/pedidos`);
      return data;
    },
  });

  // Today's start (local timezone)
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  const { data: pedidosHoje } = useQuery({
    queryKey: ["admin-pedidos-hoje", empresaId, todayStart],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/pedidos`);
      return data;
    },
  });

  const vendasHoje = useMemo(() => {
    const totalPedidos = pedidosHoje?.length ?? 0;
    const faturamento = pedidosHoje?.reduce((s, p) => s + p.total, 0) ?? 0;
    const ticketMedio = totalPedidos > 0 ? faturamento / totalPedidos : 0;
    const totalItens = 0; // detailed count available in /vendas page

    return { totalPedidos, faturamento, ticketMedio, totalItens };
  }, [pedidosHoje]);

  const activeTipos = tiposConfig ? getActiveTipos(tiposConfig) : [];
  const activeStatuses: PedidoStatus[] = ["novo", "confirmado", "preparo", "pronto", "saiu_entrega"];

  const statusCounts: Record<string, number> = {};
  for (const s of activeStatuses) {
    statusCounts[s] = pedidos?.filter((p) => p.pedido_status === s).length ?? 0;
  }

  const activePedidos = pedidos?.filter((p) => !INACTIVE_STATUSES.includes(p.pedido_status)) ?? [];
  const typeCounts: Record<string, number> = {};
  for (const t of activeTipos) {
    typeCounts[t.tipo_key] = activePedidos.filter((p) => p.tipo === t.tipo_key).length;
  }

  const recent = pedidos?.slice(0, 10) ?? [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>

        {/* Type counters */}
        {activeTipos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {activeTipos.map((t) => (
              <Card key={t.tipo_key}>
                <CardContent className="p-4 flex items-center gap-3">
                  {(() => { const Icon = tipoIcons[t.tipo_key] || Package; return <Icon className="h-8 w-8 text-primary" />; })()}
                  <div>
                    <p className="text-2xl font-bold">{typeCounts[t.tipo_key] ?? 0}</p>
                    <p className="text-xs text-muted-foreground">{t.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Status counters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {activeStatuses.map((s) => {
            const cfg = statusConfig[s];
            const Icon = cfg.icon;
            return (
              <Card key={s}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon className={`h-8 w-8 ${cfg.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{statusCounts[s]}</p>
                    <p className="text-xs text-muted-foreground">{cfg.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Vendas de Hoje - resumo compacto */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Vendas de Hoje
            </CardTitle>
            <Link
              to={`/admin/${slug}/vendas`}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Ver detalhes <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <Receipt className="h-7 w-7 text-blue-500" />
                <div>
                  <p className="text-xl font-bold">{vendasHoje.totalPedidos}</p>
                  <p className="text-xs text-muted-foreground">Pedidos</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-7 w-7 text-green-500" />
                <div>
                  <p className="text-xl font-bold">{formatBRL(vendasHoje.faturamento)}</p>
                  <p className="text-xs text-muted-foreground">Faturamento</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Receipt className="h-7 w-7 text-amber-500" />
                <div>
                  <p className="text-xl font-bold">{formatBRL(vendasHoje.ticketMedio)}</p>
                  <p className="text-xs text-muted-foreground">Ticket Médio</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Package className="h-7 w-7 text-purple-500" />
                <div>
                  <p className="text-xl font-bold">{vendasHoje.totalItens}</p>
                  <p className="text-xs text-muted-foreground">Itens Vendidos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent orders with type tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pedidos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="todos">
              <TabsList className="mb-4 flex-wrap h-auto">
                <TabsTrigger value="todos">Todos</TabsTrigger>
                {activeTipos.map((t) => (
                  <TabsTrigger key={t.tipo_key} value={t.tipo_key}>
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="todos">
                <RecentList pedidos={recent} tipos={activeTipos} />
              </TabsContent>
              {activeTipos.map((t) => (
                <TabsContent key={t.tipo_key} value={t.tipo_key}>
                  <RecentList pedidos={recent.filter((p) => p.tipo === t.tipo_key)} tipos={activeTipos} />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function RecentList({ pedidos, tipos }: { pedidos: any[]; tipos: TipoConfig[] }) {
  const tipoMap = Object.fromEntries(tipos.map((t) => [t.tipo_key, t.label]));

  if (pedidos.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhum pedido.</p>;
  }
  return (
    <div className="space-y-2">
      {pedidos.map((p) => (
        <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">#{p.numero_sequencial}</span>
            <span className="text-sm text-muted-foreground">{p.cliente_nome}</span>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-0 ${tipoColors[p.tipo] || "bg-muted text-muted-foreground"}`}>
              {tipoMap[p.tipo] || p.tipo}
            </Badge>
            {(() => {
              const cfg = statusConfig[p.pedido_status as PedidoStatus];
              if (!cfg) return null;
              return (
                <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${cfg.color}`}>
                  {cfg.label}
                </Badge>
              );
            })()}
          </div>
          <div className="text-right">
            <span className="font-medium text-primary">{formatBRL(p.total)}</span>
            <p className="text-xs text-muted-foreground">{formatDate(p.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
