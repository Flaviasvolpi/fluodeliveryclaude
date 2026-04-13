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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil } from "lucide-react";
import { formatBRL } from "@/lib/format";
import type { AdicionaisGrupo, AdicionaisItem, AdicionaisGrupoInsert, AdicionaisItemInsert } from "@/types/database";
import { toast } from "sonner";

export default function Adicionais() {
  const { empresaId } = useEmpresa();
  const qc = useQueryClient();
  const [grupoDialogOpen, setGrupoDialogOpen] = useState(false);
  const [editGrupo, setEditGrupo] = useState<AdicionaisGrupo | null>(null);
  const [selectedGrupo, setSelectedGrupo] = useState<string | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<AdicionaisItem | null>(null);

  const { data: grupos } = useQuery({
    queryKey: ["admin-adicionais-grupos", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/adicionais/grupos`);
      return data;
    },
  });

  const { data: itens } = useQuery({
    queryKey: ["admin-adicionais-itens", selectedGrupo],
    queryFn: async () => {
      if (!selectedGrupo) return [];
      const { data } = await api.get(`/empresas/${empresaId}/adicionais/itens`);
      return data;
    },
    enabled: !!selectedGrupo,
  });

  const upsertGrupo = useMutation({
    mutationFn: async (values: AdicionaisGrupoInsert & { id?: string }) => {
      const payload = { ...values, empresa_id: empresaId };
      if (values.id) {
        await api.patch(`/empresas/${empresaId}/adicionais/grupos/${values.id}`, payload);
      } else {
        await api.post(`/empresas/${empresaId}/adicionais/grupos`, payload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-adicionais-grupos", empresaId] });
      setGrupoDialogOpen(false);
      setEditGrupo(null);
      toast.success("Grupo salvo!");
    },
  });

  const upsertItem = useMutation({
    mutationFn: async (values: AdicionaisItemInsert & { id?: string }) => {
      const payload = { ...values, empresa_id: empresaId };
      if (values.id) {
        await api.patch(`/empresas/${empresaId}/adicionais/itens/${values.id}`, payload);
      } else {
        await api.post(`/empresas/${empresaId}/adicionais/itens`, payload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-adicionais-itens", selectedGrupo] });
      setItemDialogOpen(false);
      setEditItem(null);
      toast.success("Item salvo!");
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Adicionais</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Grupos</CardTitle>
              <Dialog open={grupoDialogOpen} onOpenChange={(o) => { setGrupoDialogOpen(o); if (!o) setEditGrupo(null); }}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{editGrupo ? "Editar" : "Novo"} Grupo</DialogTitle></DialogHeader>
                  <GrupoForm initial={editGrupo} onSubmit={(v) => upsertGrupo.mutate(v)} loading={upsertGrupo.isPending} />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {grupos?.map((g) => (
                  <div key={g.id} className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedGrupo === g.id ? "border-primary bg-primary/5" : "hover:border-primary/30"}`} onClick={() => setSelectedGrupo(g.id)}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{g.nome}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Mín {g.min_select} · Máx {g.max_select}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditGrupo(g); setGrupoDialogOpen(true); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Itens {selectedGrupo ? `— ${grupos?.find((g) => g.id === selectedGrupo)?.nome}` : ""}</CardTitle>
              {selectedGrupo && (
                <Dialog open={itemDialogOpen} onOpenChange={(o) => { setItemDialogOpen(o); if (!o) setEditItem(null); }}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>{editItem ? "Editar" : "Novo"} Item</DialogTitle></DialogHeader>
                    <ItemForm initial={editItem} grupoId={selectedGrupo} onSubmit={(v) => upsertItem.mutate(v)} loading={upsertItem.isPending} />
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {!selectedGrupo ? (
                <p className="text-sm text-muted-foreground">Selecione um grupo para ver os itens.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Ativo</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.nome}</TableCell>
                        <TableCell>{formatBRL(item.preco)}</TableCell>
                        <TableCell>
                          <Switch checked={item.ativo} onCheckedChange={async (v) => {
                            try {
                              await api.patch(`/empresas/${empresaId}/adicionais/itens/${item.id}`, { ativo: v });
                              qc.invalidateQueries({ queryKey: ["admin-adicionais-itens", selectedGrupo] });
                            } catch {
                              toast.error("Erro ao atualizar item.");
                            }
                          }} />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => { setEditItem(item); setItemDialogOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

function GrupoForm({ initial, onSubmit, loading }: { initial: AdicionaisGrupo | null; onSubmit: (v: any) => void; loading: boolean }) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [minSelect, setMinSelect] = useState(initial?.min_select ?? 0);
  const [maxSelect, setMaxSelect] = useState(initial?.max_select ?? 1);
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit({ ...(initial ? { id: initial.id } : {}), nome, min_select: minSelect, max_select: maxSelect }); }}>
      <div className="space-y-1"><Label>Nome *</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} required /></div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1"><Label>Mín. seleção</Label><Input type="number" value={minSelect} onChange={(e) => setMinSelect(Number(e.target.value))} /></div>
        <div className="space-y-1"><Label>Máx. seleção</Label><Input type="number" value={maxSelect} onChange={(e) => setMaxSelect(Number(e.target.value))} /></div>
      </div>
      <Button type="submit" disabled={loading} className="w-full">{loading ? "Salvando..." : "Salvar"}</Button>
    </form>
  );
}

function ItemForm({ initial, grupoId, onSubmit, loading }: { initial: AdicionaisItem | null; grupoId: string; onSubmit: (v: any) => void; loading: boolean }) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [preco, setPreco] = useState(initial?.preco?.toString() ?? "0");
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit({ ...(initial ? { id: initial.id } : {}), grupo_id: grupoId, nome, preco: Number(preco) }); }}>
      <div className="space-y-1"><Label>Nome *</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} required /></div>
      <div className="space-y-1"><Label>Preço (R$)</Label><Input type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} /></div>
      <Button type="submit" disabled={loading} className="w-full">{loading ? "Salvando..." : "Salvar"}</Button>
    </form>
  );
}
