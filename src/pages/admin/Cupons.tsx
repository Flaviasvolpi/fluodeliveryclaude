import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useEmpresa } from "@/contexts/EmpresaContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Ticket, Search, Copy, TrendingDown, CalendarDays } from "lucide-react";
import { format, startOfDay, startOfMonth } from "date-fns";

type Cupom = {
  id: string;
  empresa_id: string;
  regra_id: string | null;
  cliente_id: string | null;
  codigo: string;
  tipo_desconto: string;
  valor_desconto: number;
  valor_minimo: number;
  uso_maximo: number;
  uso_atual: number;
  valido_ate: string | null;
  ativo: boolean;
  created_at: string;
  clientes?: { nome: string; telefone: string } | null;
};

function generateCode() {
  return "PROMO-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function Cupons() {
  const { empresaId } = useEmpresa();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    codigo: generateCode(),
    tipo_desconto: "percentual",
    valor_desconto: "",
    valor_minimo: "0",
    uso_maximo: "1",
    validade_dias: "30",
  });

  const { data: cupons = [], isLoading } = useQuery({
    queryKey: ["cupons", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/cupons`);
      return data as Cupom[];
    },
  });

  // Resumo de uso de cupons (pedidos com cupom_id)
  const todayStart = startOfDay(new Date()).toISOString();
  const monthStart = startOfMonth(new Date()).toISOString();

  const { data: resumoHoje } = useQuery({
    queryKey: ["cupons-resumo-hoje", empresaId, todayStart],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/pedidos`);
      const count = data?.length ?? 0;
      const total = data?.reduce((s, p) => s + (p.desconto ?? 0), 0) ?? 0;
      return { count, total };
    },
  });

  const { data: resumoMes } = useQuery({
    queryKey: ["cupons-resumo-mes", empresaId, monthStart],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/pedidos`);
      const count = data?.length ?? 0;
      const total = data?.reduce((s, p) => s + (p.desconto ?? 0), 0) ?? 0;
      return { count, total };
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const validadeDias = parseInt(form.validade_dias) || 30;
      const validoAte = new Date();
      validoAte.setDate(validoAte.getDate() + validadeDias);

      await api.post(`/empresas/${empresaId}/cupons`, {
        empresa_id: empresaId,
        codigo: form.codigo.toUpperCase().trim(),
        tipo_desconto: form.tipo_desconto,
        valor_desconto: parseFloat(form.valor_desconto) || 0,
        valor_minimo: parseFloat(form.valor_minimo) || 0,
        uso_maximo: parseInt(form.uso_maximo) || 1,
        valido_ate: validoAte.toISOString(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cupons", empresaId] });
      toast.success("Cupom criado");
      setOpen(false);
      setForm({ ...form, codigo: generateCode(), valor_desconto: "" });
    },
    onError: (e: any) => toast.error(e.message?.includes("unique") ? "Código já existe" : "Erro ao criar cupom"),
  });

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      await api.patch(`/empresas/${empresaId}/cupons/${id}`, { ativo });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cupons", empresaId] }),
  });

  const getStatus = (c: Cupom) => {
    if (!c.ativo) return { label: "Inativo", variant: "secondary" as const };
    if (c.uso_atual >= c.uso_maximo) return { label: "Esgotado", variant: "destructive" as const };
    if (c.valido_ate && new Date(c.valido_ate) < new Date()) return { label: "Expirado", variant: "outline" as const };
    return { label: "Ativo", variant: "default" as const };
  };

  const filtered = cupons.filter((c) =>
    c.codigo.toLowerCase().includes(search.toLowerCase()) ||
    c.clientes?.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.clientes?.telefone?.includes(search)
  );

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Ticket className="h-6 w-6 text-primary" /> Cupons</h2>
          <p className="text-sm text-muted-foreground">Gerencie cupons de desconto manuais e automáticos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Cupom</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Cupom Manual</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Código *</Label>
                <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="PROMO-ABC123" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Tipo de desconto</Label>
                  <Select value={form.tipo_desconto} onValueChange={(v) => setForm({ ...form, tipo_desconto: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentual">Percentual (%)</SelectItem>
                      <SelectItem value="valor_fixo">Valor fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Valor *</Label>
                  <Input type="number" min="0" step="0.01" value={form.valor_desconto} onChange={(e) => setForm({ ...form, valor_desconto: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Valor mínimo (R$)</Label>
                  <Input type="number" min="0" step="0.01" value={form.valor_minimo} onChange={(e) => setForm({ ...form, valor_minimo: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Usos máximos</Label>
                  <Input type="number" min="1" value={form.uso_maximo} onChange={(e) => setForm({ ...form, uso_maximo: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Validade (dias)</Label>
                  <Input type="number" min="1" value={form.validade_dias} onChange={(e) => setForm({ ...form, validade_dias: e.target.value })} />
                </div>
              </div>
              <Button className="w-full" onClick={() => create.mutate()} disabled={!form.codigo || !form.valor_desconto || create.isPending}>
                {create.isPending ? "Criando..." : "Criar Cupom"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Ticket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cupons usados hoje</p>
              <p className="text-2xl font-bold">{resumoHoje?.count ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cupons usados no mês</p>
              <p className="text-2xl font-bold">{resumoMes?.count ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Descontos concedidos (hoje)</p>
              <p className="text-2xl font-bold text-destructive">
                R$ {(resumoHoje?.total ?? 0).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por código ou cliente..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum cupom encontrado</CardContent></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Ativo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const status = getStatus(c);
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <button
                          className="font-mono text-sm font-medium flex items-center gap-1 hover:text-primary transition-colors"
                          onClick={() => { navigator.clipboard.writeText(c.codigo); toast.success("Código copiado"); }}
                        >
                          {c.codigo} <Copy className="h-3 w-3" />
                        </button>
                      </TableCell>
                      <TableCell>
                        {c.tipo_desconto === "percentual" ? `${c.valor_desconto}%` : `R$ ${c.valor_desconto.toFixed(2)}`}
                        {c.valor_minimo > 0 && <span className="text-xs text-muted-foreground block">mín R$ {c.valor_minimo.toFixed(2)}</span>}
                      </TableCell>
                      <TableCell>{c.uso_atual}/{c.uso_maximo}</TableCell>
                      <TableCell>
                        {c.clientes ? (
                          <span className="text-sm">{c.clientes.nome}<br /><span className="text-xs text-muted-foreground">{c.clientes.telefone}</span></span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Todos</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.valido_ate ? format(new Date(c.valido_ate), "dd/MM/yyyy") : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{c.regra_id ? "Automático" : "Manual"}</Badge>
                      </TableCell>
                      <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                      <TableCell>
                        <Switch checked={c.ativo} onCheckedChange={(v) => toggleAtivo.mutate({ id: c.id, ativo: v })} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </AdminLayout>
  );
}
