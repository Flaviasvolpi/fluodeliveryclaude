import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useEmpresa } from "@/contexts/EmpresaContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Gift } from "lucide-react";

type Regra = {
  id: string;
  empresa_id: string;
  nome: string;
  tipo_recompensa: string;
  valor_recompensa: number;
  meta_pedidos: number;
  meta_valor: number | null;
  validade_dias: number;
  ativo: boolean;
  created_at: string;
};

const emptyForm = {
  nome: "",
  tipo_recompensa: "percentual",
  valor_recompensa: "",
  meta_pedidos: "10",
  meta_valor: "",
  validade_dias: "30",
};

export default function Fidelidade() {
  const { empresaId } = useEmpresa();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: regras = [], isLoading } = useQuery({
    queryKey: ["fidelidade-regras", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/fidelidade`);
      return data as Regra[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        empresa_id: empresaId,
        nome: form.nome,
        tipo_recompensa: form.tipo_recompensa,
        valor_recompensa: parseFloat(form.valor_recompensa) || 0,
        meta_pedidos: parseInt(form.meta_pedidos) || 10,
        meta_valor: form.meta_valor ? parseFloat(form.meta_valor) : null,
        validade_dias: parseInt(form.validade_dias) || 30,
      };
      if (editId) {
        await api.patch(`/empresas/${empresaId}/fidelidade/${editId}`, payload);
      } else {
        await api.post(`/empresas/${empresaId}/fidelidade`, payload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fidelidade-regras", empresaId] });
      toast.success(editId ? "Regra atualizada" : "Regra criada");
      closeDialog();
    },
    onError: () => toast.error("Erro ao salvar regra"),
  });

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      await api.patch(`/empresas/${empresaId}/fidelidade/${id}`, { ativo });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fidelidade-regras", empresaId] }),
    onError: () => toast.error("Erro ao atualizar regra."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/empresas/${empresaId}/fidelidade/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fidelidade-regras", empresaId] });
      toast.success("Regra removida");
    },
    onError: () => toast.error("Erro ao remover regra."),
  });

  const closeDialog = () => {
    setOpen(false);
    setEditId(null);
    setForm(emptyForm);
  };

  const openEdit = (r: Regra) => {
    setEditId(r.id);
    setForm({
      nome: r.nome,
      tipo_recompensa: r.tipo_recompensa,
      valor_recompensa: String(r.valor_recompensa),
      meta_pedidos: String(r.meta_pedidos),
      meta_valor: r.meta_valor ? String(r.meta_valor) : "",
      validade_dias: String(r.validade_dias),
    });
    setOpen(true);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Gift className="h-6 w-6 text-primary" /> Fidelidade</h2>
          <p className="text-sm text-muted-foreground">Configure regras de recompensa automática para clientes</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nova Regra</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Editar Regra" : "Nova Regra"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Nome da regra *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: A cada 10 pedidos" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Tipo de recompensa</Label>
                  <Select value={form.tipo_recompensa} onValueChange={(v) => setForm({ ...form, tipo_recompensa: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentual">Percentual (%)</SelectItem>
                      <SelectItem value="valor_fixo">Valor fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Valor da recompensa *</Label>
                  <Input type="number" min="0" step="0.01" value={form.valor_recompensa} onChange={(e) => setForm({ ...form, valor_recompensa: e.target.value })} placeholder={form.tipo_recompensa === "percentual" ? "Ex: 10" : "Ex: 5.00"} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Meta de pedidos *</Label>
                  <Input type="number" min="1" value={form.meta_pedidos} onChange={(e) => setForm({ ...form, meta_pedidos: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Meta de valor (R$)</Label>
                  <Input type="number" min="0" step="0.01" value={form.meta_valor} onChange={(e) => setForm({ ...form, meta_valor: e.target.value })} placeholder="Opcional" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Validade do cupom (dias)</Label>
                <Input type="number" min="1" value={form.validade_dias} onChange={(e) => setForm({ ...form, validade_dias: e.target.value })} />
              </div>
              <Button className="w-full" onClick={() => save.mutate()} disabled={!form.nome || !form.valor_recompensa || save.isPending}>
                {save.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : regras.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma regra de fidelidade cadastrada</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {regras.map((r) => (
            <Card key={r.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {r.nome}
                    <Badge variant={r.ativo ? "default" : "secondary"}>{r.ativo ? "Ativa" : "Inativa"}</Badge>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch checked={r.ativo} onCheckedChange={(v) => toggleAtivo.mutate({ id: r.id, ativo: v })} />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Recompensa</p>
                    <p className="font-medium">{r.tipo_recompensa === "percentual" ? `${r.valor_recompensa}%` : `R$ ${Number(r.valor_recompensa).toFixed(2)}`}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Meta</p>
                    <p className="font-medium">{r.meta_pedidos} pedidos</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Validade</p>
                    <p className="font-medium">{r.validade_dias} dias</p>
                  </div>
                  {r.meta_valor && (
                    <div>
                      <p className="text-muted-foreground">Valor mínimo</p>
                      <p className="font-medium">R$ {Number(r.meta_valor).toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
