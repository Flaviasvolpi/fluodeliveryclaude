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
import type { Categoria, CategoriaInsert } from "@/types/database";
import { toast } from "sonner";

export default function Categorias() {
  const { empresaId } = useEmpresa();
  const qc = useQueryClient();
  const [editItem, setEditItem] = useState<Categoria | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: categorias, isLoading } = useQuery({
    queryKey: ["admin-categorias", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/categorias`);
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async (values: CategoriaInsert & { id?: string }) => {
      const payload = { ...values, empresa_id: empresaId };
      if (values.id) {
        await api.patch(`/empresas/${empresaId}/categorias/${values.id}`, payload);
      } else {
        await api.post(`/empresas/${empresaId}/categorias`, payload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categorias", empresaId] });
      setDialogOpen(false);
      setEditItem(null);
      toast.success("Categoria salva!");
    },
    onError: () => toast.error("Erro ao salvar categoria."),
  });

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      await api.patch(`/empresas/${empresaId}/categorias/${id}`, { ativo });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-categorias", empresaId] }),
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Categorias</h2>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditItem(null); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editItem ? "Editar" : "Nova"} Categoria</DialogTitle></DialogHeader>
              <CategoriaForm
                initial={editItem}
                onSubmit={(v) => upsert.mutate(v)}
                loading={upsert.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Ordem</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categorias?.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell>{c.ordem}</TableCell>
                <TableCell>
                  <Switch checked={c.ativo} onCheckedChange={(v) => toggleAtivo.mutate({ id: c.id, ativo: v })} />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => { setEditItem(c); setDialogOpen(true); }}>
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

function CategoriaForm({
  initial,
  onSubmit,
  loading,
}: {
  initial: Categoria | null;
  onSubmit: (v: CategoriaInsert & { id?: string }) => void;
  loading: boolean;
}) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [ordem, setOrdem] = useState(initial?.ordem ?? 0);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...(initial ? { id: initial.id } : {}), nome, ordem } as any);
      }}
    >
      <div className="space-y-1">
        <Label>Nome *</Label>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label>Ordem</Label>
        <Input type="number" value={ordem} onChange={(e) => setOrdem(Number(e.target.value))} />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
