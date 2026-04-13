import AdminLayout from "@/components/layout/AdminLayout";
import { useEmpresa } from "@/contexts/EmpresaContext";
import api from "@/lib/api";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ShoppingBag, DollarSign, Receipt, Package, Trophy, CalendarIcon, ChevronDown, ChevronUp } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { useMemo, useState } from "react";
import { format, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type PeriodPreset = "today" | "7d" | "30d" | "custom";

export default function Vendas() {
  const [showAll, setShowAll] = useState(false);
  const { empresa } = useEmpresa();
  const [preset, setPreset] = useState<PeriodPreset>("today");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  const dateRange = useMemo(() => {
    const now = new Date();
    if (preset === "today") return { from: startOfDay(now), to: now };
    if (preset === "7d") return { from: startOfDay(subDays(now, 7)), to: now };
    if (preset === "30d") return { from: startOfDay(subDays(now, 30)), to: now };
    return {
      from: customFrom ? startOfDay(customFrom) : startOfDay(subDays(now, 30)),
      to: customTo ? new Date(customTo.getFullYear(), customTo.getMonth(), customTo.getDate(), 23, 59, 59) : now,
    };
  }, [preset, customFrom, customTo]);

  const { data: pedidos, isLoading: loadingPedidos } = useQuery({
    queryKey: ["vendas-pedidos", empresa.id, dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresa.id}/pedidos`, {
        params: { from: dateRange.from.toISOString(), to: dateRange.to.toISOString(), exclude_status: "cancelado" }
      });
      return data;
    },
  });

  const pedidoIds = useMemo(() => pedidos?.map((p) => p.id) ?? [], [pedidos]);

  const { data: itens, isLoading: loadingItens } = useQuery({
    queryKey: ["vendas-itens", empresa.id, pedidoIds],
    enabled: pedidoIds.length > 0,
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresa.id}/pedido-itens`);
      return data;
    },
  });

  const isLoading = loadingPedidos || loadingItens;

  const resumo = useMemo(() => {
    const totalPedidos = pedidos?.length ?? 0;
    const faturamento = pedidos?.reduce((s, p) => s + p.total, 0) ?? 0;
    const ticketMedio = totalPedidos > 0 ? faturamento / totalPedidos : 0;
    const totalItens = itens?.reduce((s, i) => s + i.qtd, 0) ?? 0;

    const map = new Map<string, { nome: string; qtd: number; total: number }>();
    for (const i of itens ?? []) {
      const nome = i.variante_nome_snapshot
        ? `${i.nome_snapshot} (${i.variante_nome_snapshot})`
        : i.nome_snapshot;
      const cur = map.get(nome) ?? { nome, qtd: 0, total: 0 };
      cur.qtd += i.qtd;
      cur.total += i.preco_unit_snapshot * i.qtd;
      map.set(nome, cur);
    }
    const ranking = [...map.values()].sort((a, b) => b.qtd - a.qtd);

    return { totalPedidos, faturamento, ticketMedio, totalItens, ranking };
  }, [pedidos, itens]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header + Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            Vendas
          </h1>

          <div className="flex items-center gap-2 flex-wrap">
            {(["today", "7d", "30d"] as PeriodPreset[]).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={preset === p ? "default" : "outline"}
                onClick={() => setPreset(p)}
              >
                {p === "today" ? "Hoje" : p === "7d" ? "7 dias" : "30 dias"}
              </Button>
            ))}

            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant={preset === "custom" ? "default" : "outline"}>
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {preset === "custom" && customFrom
                    ? `${format(customFrom, "dd/MM", { locale: ptBR })} - ${customTo ? format(customTo, "dd/MM", { locale: ptBR }) : "..."}`
                    : "Personalizado"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4 space-y-3" align="end">
                <p className="text-sm font-medium">De:</p>
                <Calendar
                  mode="single"
                  selected={customFrom}
                  onSelect={(d) => { setCustomFrom(d); setPreset("custom"); }}
                  disabled={(d) => d > new Date()}
                  className={cn("p-3 pointer-events-auto")}
                  locale={ptBR}
                />
                <p className="text-sm font-medium">Até:</p>
                <Calendar
                  mode="single"
                  selected={customTo}
                  onSelect={(d) => { setCustomTo(d); setPreset("custom"); }}
                  disabled={(d) => d > new Date()}
                  className={cn("p-3 pointer-events-auto")}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Receipt className="h-4 w-4 text-blue-500" /> Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{resumo.totalPedidos}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-green-500" /> Faturamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatBRL(resumo.faturamento)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Receipt className="h-4 w-4 text-amber-500" /> Ticket Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatBRL(resumo.ticketMedio)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Package className="h-4 w-4 text-purple-500" /> Itens Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{resumo.totalItens}</p>
            </CardContent>
          </Card>
        </div>

        {/* Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Produtos Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <colgroup>
                <col className="w-12" />
                <col />
                <col className="w-20" />
                <col className="w-28" />
              </colgroup>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && resumo.ranking.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhuma venda encontrada no período
                    </TableCell>
                  </TableRow>
                )}
                {(showAll ? resumo.ranking : resumo.ranking.slice(0, 5)).map((r, i) => (
                  <TableRow key={r.nome}>
                    <TableCell className="font-medium">{i + 1}</TableCell>
                    <TableCell>{r.nome}</TableCell>
                    <TableCell className="text-right">{r.qtd}</TableCell>
                    <TableCell className="text-right">{formatBRL(r.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {resumo.ranking.length > 5 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto py-3"
              >
                {showAll ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {showAll ? "Mostrar menos" : `Ver mais ${resumo.ranking.length - 5} produtos`}
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
