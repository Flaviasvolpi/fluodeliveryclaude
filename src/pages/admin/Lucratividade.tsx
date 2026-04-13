import AdminLayout from "@/components/layout/AdminLayout";
import { useEmpresa } from "@/contexts/EmpresaContext";
import api from "@/lib/api";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";

interface ProdutoRow {
  nome: string;
  variante?: string;
  custo: number | null;
  venda: number | null;
  lucro: number | null;
  margem: number | null;
}

function calcMargem(custo: number | null, venda: number | null): { lucro: number | null; margem: number | null } {
  if (custo == null || venda == null || venda === 0) return { lucro: null, margem: null };
  const lucro = venda - custo;
  const margem = (lucro / venda) * 100;
  return { lucro, margem };
}

function MargemBadge({ margem }: { margem: number | null }) {
  if (margem == null) return <span className="text-muted-foreground text-xs">—</span>;
  const label = `${margem.toFixed(1)}%`;
  if (margem > 30) return <Badge className="bg-green-600 hover:bg-green-700 text-white">{label}</Badge>;
  if (margem >= 15) return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">{label}</Badge>;
  return <Badge variant="destructive">{label}</Badge>;
}

export default function Lucratividade() {
  const { empresa } = useEmpresa();

  const { data: produtos } = useQuery({
    queryKey: ["lucratividade-produtos", empresa.id],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresa.id}/produtos`);
      return data ?? [];
    },
  });

  const { data: variantes } = useQuery({
    queryKey: ["lucratividade-variantes", empresa.id],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresa.id}/produto-variantes`);
      return data ?? [];
    },
  });

  const rows = useMemo<ProdutoRow[]>(() => {
    if (!produtos) return [];
    const result: ProdutoRow[] = [];
    for (const p of produtos) {
      if (p.possui_variantes) {
        const pvs = (variantes ?? []).filter((v) => v.produto_id === p.id);
        for (const v of pvs) {
          const { lucro, margem } = calcMargem(v.custo, v.preco_venda);
          result.push({ nome: p.nome, variante: v.nome, custo: v.custo, venda: v.preco_venda, lucro, margem });
        }
      } else {
        const { lucro, margem } = calcMargem(p.custo_base, p.preco_base);
        result.push({ nome: p.nome, custo: p.custo_base, venda: p.preco_base, lucro, margem });
      }
    }
    result.sort((a, b) => (a.margem ?? 999) - (b.margem ?? 999));
    return result;
  }, [produtos, variantes]);

  const comMargem = rows.filter((r) => r.margem != null);
  const margemMedia = comMargem.length ? comMargem.reduce((s, r) => s + r.margem!, 0) / comMargem.length : null;
  const maisLucrativo = comMargem.length ? comMargem[comMargem.length - 1] : null;
  const menosLucrativo = comMargem.length ? comMargem[0] : null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Margem de Lucro dos Produtos
        </h1>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Margem Média</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{margemMedia != null ? `${margemMedia.toFixed(1)}%` : "—"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-600" /> Mais Lucrativo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold truncate">
                {maisLucrativo ? `${maisLucrativo.nome}${maisLucrativo.variante ? ` (${maisLucrativo.variante})` : ""}` : "—"}
              </p>
              {maisLucrativo?.margem != null && (
                <p className="text-sm text-muted-foreground">{maisLucrativo.margem.toFixed(1)}% de margem</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-4 w-4 text-destructive" /> Menor Margem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold truncate">
                {menosLucrativo ? `${menosLucrativo.nome}${menosLucrativo.variante ? ` (${menosLucrativo.variante})` : ""}` : "—"}
              </p>
              {menosLucrativo?.margem != null && (
                <p className="text-sm text-muted-foreground">{menosLucrativo.margem.toFixed(1)}% de margem</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Variante</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Venda</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum produto ativo encontrado
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((r, i) => (
                  <TableRow key={i} className={r.margem == null ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{r.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{r.variante ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {r.custo != null ? formatBRL(r.custo) : <span className="text-xs text-muted-foreground">Não informado</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.venda != null ? formatBRL(r.venda) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.lucro != null ? formatBRL(r.lucro) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <MargemBadge margem={r.margem} />
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
