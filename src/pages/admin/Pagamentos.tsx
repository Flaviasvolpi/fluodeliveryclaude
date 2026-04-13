import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useEmpresa } from "@/contexts/EmpresaContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil } from "lucide-react";
import type { FormaPagamento, FormaPagamentoInsert } from "@/types/database";
import { toast } from "sonner";

export default function Pagamentos() {
  const { empresaId } = useEmpresa();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<FormaPagamento | null>(null);

  const { data: formas } = useQuery({
    queryKey: ["admin-formas-pagamento", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/formas-pagamento`);
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async (values: FormaPagamentoInsert & { id?: string }) => {
      const payload = { ...values, empresa_id: empresaId };
      if (values.id) {
        await api.patch(`/empresas/${empresaId}/formas-pagamento/${values.id}`, payload);
      } else {
        await api.post(`/empresas/${empresaId}/formas-pagamento`, payload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-formas-pagamento", empresaId] });
      setDialogOpen(false);
      setEditItem(null);
      toast.success("Forma de pagamento salva!");
    },
  });

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      await api.patch(`/empresas/${empresaId}/formas-pagamento/${id}`, { ativo });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-formas-pagamento", empresaId] }),
    onError: () => toast.error("Erro ao atualizar forma de pagamento."),
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Formas de Pagamento</h2>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditItem(null); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editItem ? "Editar" : "Nova"} Forma de Pagamento</DialogTitle></DialogHeader>
              <PagamentoForm initial={editItem} onSubmit={(v) => upsert.mutate(v)} loading={upsert.isPending} />
            </DialogContent>
          </Dialog>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Exige Troco</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formas?.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.nome}</TableCell>
                <TableCell>{f.exige_troco ? "Sim" : "Não"}</TableCell>
                <TableCell>
                  <Switch checked={f.ativo} onCheckedChange={(v) => toggleAtivo.mutate({ id: f.id, ativo: v })} />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => { setEditItem(f); setDialogOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}

function PagamentoForm({ initial, onSubmit, loading }: { initial: FormaPagamento | null; onSubmit: (v: any) => void; loading: boolean }) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [exigeTroco, setExigeTroco] = useState(initial?.exige_troco ?? false);
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit({ ...(initial ? { id: initial.id } : {}), nome, exige_troco: exigeTroco }); }}>
      <div className="space-y-1"><Label>Nome *</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex: Dinheiro, Cartão, PIX" /></div>
      <div className="flex items-center gap-2">
        <Switch checked={exigeTroco} onCheckedChange={setExigeTroco} />
        <Label>Exige troco</Label>
      </div>
      <Button type="submit" disabled={loading} className="w-full">{loading ? "Salvando..." : "Salvar"}</Button>
    </form>
  );
}
