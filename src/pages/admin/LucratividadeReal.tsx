import AdminLayout from "@/components/layout/AdminLayout";
import { useEmpresa } from "@/contexts/EmpresaContext";
import api from "@/lib/api";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DollarSign, TrendingUp, Package, CalendarIcon, ShoppingCart } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";
import { format, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type PeriodPreset = "today" | "7d" | "30d" | "custom";

function MargemBadge({ margem }: { margem: number | null }) {
  if (margem == null) return <span className="text-muted-foreground text-xs">—</span>;
  const label = `${margem.toFixed(1)}%`;
  if (margem > 30) return <Badge className="bg-green-600 hover:bg-green-700 text-white">{label}</Badge>;
  if (margem >= 15) return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">{label}</Badge>;
  return <Badge variant="destructive">{label}</Badge>;
}

export default function LucratividadeReal() {
  const { empresa } = useEmpresa();
  const [preset, setPreset] = useState<PeriodPreset>("30d");
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

  const { data: itens, isLoading } = useQuery({
    queryKey: ["lucratividade-real", empresa.id, dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresa.id}/pedido-itens`);

      if (!data) return [];

      // Filter by date via pedidos
      const pedidoIds = [...new Set(data.map((i) => i.pedido_id))];
      if (pedidoIds.length === 0) return [];

      // Fetch pedidos in the date range
      const { data: pedidos } = await api.get(`/empresas/${empresa.id}/pedidos`, {
        params: { from: dateRange.from.toISOString(), to: dateRange.to.toISOString() }
      });

      if (!pedidos) return [];
      const validIds = new Set(pedidos.map((p) => p.id));

      return data.filter((i) => validIds.has(i.pedido_id));
    },
  });

  interface ProdutoAgg {
    nome: string;
    variante: string | null;
    qtd: number;
    faturamento: number;
    custo: number;
    lucro: number;
    margem: number | null;
  }

  const { rows, totals } = useMemo(() => {
    if (!itens || itens.length === 0)
      return {
        rows: [] as ProdutoAgg[],
        totals: { faturamento: 0, custo: 0, lucro: 0, qtd: 0, margem: null as number | null },
      };

    const map = new Map<string, ProdutoAgg>();

    for (const item of itens) {
      const key = `${item.nome_snapshot}||${item.variante_nome_snapshot ?? ""}`;
      const existing = map.get(key);
      const fat = item.preco_unit_snapshot * item.qtd;
      const cust = item.custo_unit_snapshot * item.qtd;

      if (existing) {
        existing.qtd += item.qtd;
        existing.faturamento += fat;
        existing.custo += cust;
      } else {
        map.set(key, {
          nome: item.nome_snapshot,
          variante: item.variante_nome_snapshot,
          qtd: item.qtd,
          faturamento: fat,
          custo: cust,
          lucro: 0,
          margem: null,
        });
      }
    }

    let totalFat = 0;
    let totalCust = 0;
    let totalQtd = 0;

    const result: ProdutoAgg[] = [];
    for (const r of map.values()) {
      r.lucro = r.faturamento - r.custo;
      r.margem = r.faturamento > 0 ? (r.lucro / r.faturamento) * 100 : null;
      totalFat += r.faturamento;
      totalCust += r.custo;
      totalQtd += r.qtd;
      result.push(r);
    }

    result.sort((a, b) => b.lucro - a.lucro);

    const totalLucro = totalFat - totalCust;
    return {
      rows: result,
      totals: {
        faturamento: totalFat,
        custo: totalCust,
        lucro: totalLucro,
        qtd: totalQtd,
        margem: totalFat > 0 ? (totalLucro / totalFat) * 100 : null,
      },
    };
  }, [itens]);

  const lucroTotal = totals.lucro;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Lucratividade
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

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-5 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatBRL(totals.faturamento)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Custo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatBRL(totals.custo)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-600" /> Lucro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatBRL(totals.lucro)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Margem</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {totals.margem != null ? `${totals.margem.toFixed(1)}%` : "—"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <ShoppingCart className="h-4 w-4" /> Itens Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totals.qtd}</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Variante</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Faturamento</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                  <TableHead className="text-right">% Lucro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Nenhuma venda encontrada no período
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{r.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{r.variante ?? "—"}</TableCell>
                    <TableCell className="text-right">{r.qtd}</TableCell>
                    <TableCell className="text-right">{formatBRL(r.faturamento)}</TableCell>
                    <TableCell className="text-right">{formatBRL(r.custo)}</TableCell>
                    <TableCell className="text-right">{formatBRL(r.lucro)}</TableCell>
                    <TableCell className="text-right">
                      <MargemBadge margem={r.margem} />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {lucroTotal > 0 ? `${((r.lucro / lucroTotal) * 100).toFixed(1)}%` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
