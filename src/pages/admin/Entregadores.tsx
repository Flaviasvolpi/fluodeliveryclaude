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
import { toast } from "sonner";

type Entregador = {
  id: string;
  empresa_id: string;
  nome: string;
  telefone: string | null;
  ativo: boolean;
  created_at: string;
};

export default function Entregadores() {
  const { empresaId } = useEmpresa();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Entregador | null>(null);

  const { data: entregadores } = useQuery({
    queryKey: ["admin-entregadores", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/entregadores`);
      return data as Entregador[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (values: { id?: string; nome: string; telefone: string }) => {
      const payload = { ...values, empresa_id: empresaId };
      if (values.id) {
        await api.patch(`/empresas/${empresaId}/entregadores/${values.id}`, payload);
      } else {
        await api.post(`/empresas/${empresaId}/entregadores`, payload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-entregadores", empresaId] });
      setDialogOpen(false);
      setEditItem(null);
      toast.success("Entregador salvo!");
    },
  });

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      await api.patch(`/empresas/${empresaId}/entregadores/${id}`, { ativo });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-entregadores", empresaId] }),
    onError: () => toast.error("Erro ao atualizar entregador."),
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Entregadores</h2>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditItem(null); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editItem ? "Editar" : "Novo"} Entregador</DialogTitle></DialogHeader>
              <EntregadorForm initial={editItem} onSubmit={(v) => upsert.mutate(v)} loading={upsert.isPending} />
            </DialogContent>
          </Dialog>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entregadores?.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.nome}</TableCell>
                <TableCell>{e.telefone || "—"}</TableCell>
                <TableCell>
                  <Switch checked={e.ativo} onCheckedChange={(v) => toggleAtivo.mutate({ id: e.id, ativo: v })} />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => { setEditItem(e); setDialogOpen(true); }}>
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

function EntregadorForm({ initial, onSubmit, loading }: { initial: Entregador | null; onSubmit: (v: any) => void; loading: boolean }) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [telefone, setTelefone] = useState(initial?.telefone ?? "");
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit({ ...(initial ? { id: initial.id } : {}), nome, telefone }); }}>
      <div className="space-y-1"><Label>Nome *</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Nome do entregador" /></div>
      <div className="space-y-1"><Label>Telefone</Label><Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" /></div>
      <Button type="submit" disabled={loading} className="w-full">{loading ? "Salvando..." : "Salvar"}</Button>
    </form>
  );
}
