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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { toast } from "sonner";

interface Taxa {
  id: string;
  cep_inicio: string;
  cep_fim: string;
  nome_regiao: string | null;
  taxa: number;
  valor_min_gratis: number | null;
  ativo: boolean;
  ordem: number;
}

function maskCep(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export default function TaxasEntrega() {
  const { empresaId } = useEmpresa();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Taxa | null>(null);

  const { data: taxas } = useQuery({
    queryKey: ["admin-taxas-entrega", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/taxas-entrega`);
      return data as Taxa[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (values: any) => {
      if (values.id) {
        await api.patch(`/empresas/${empresaId}/taxas-entrega/${values.id}`, values);
      } else {
        await api.post(`/empresas/${empresaId}/taxas-entrega`, values);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-taxas-entrega", empresaId] });
      setDialogOpen(false);
      setEditItem(null);
      toast.success("Faixa salva!");
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || "Erro ao salvar faixa.");
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/empresas/${empresaId}/taxas-entrega/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-taxas-entrega", empresaId] });
      toast.success("Faixa removida!");
    },
  });

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      await api.patch(`/empresas/${empresaId}/taxas-entrega/${id}`, { ativo });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-taxas-entrega", empresaId] }),
  });

  return (
    <AdminLayout>
      <div className="space-y-4 max-w-4xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-2xl font-bold">Taxas de Entrega por CEP</h2>
            <p className="text-sm text-muted-foreground">
              Configure faixas de CEP com taxa diferente. Se o subtotal do pedido atingir o mínimo, a entrega fica grátis.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditItem(null); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova faixa</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editItem ? "Editar" : "Nova"} faixa de CEP</DialogTitle>
              </DialogHeader>
              <TaxaForm
                key={editItem?.id ?? "new"}
                initial={editItem}
                onSubmit={(v) => upsert.mutate(v)}
                loading={upsert.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Faixa CEP</TableHead>
                <TableHead>Região</TableHead>
                <TableHead>Taxa</TableHead>
                <TableHead>Grátis acima de</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxas?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma faixa cadastrada. Se nenhuma estiver ativa, a taxa padrão da empresa é usada.
                  </TableCell>
                </TableRow>
              )}
              {taxas?.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-sm">
                    {maskCep(t.cep_inicio)} — {maskCep(t.cep_fim)}
                  </TableCell>
                  <TableCell>{t.nome_regiao || "—"}</TableCell>
                  <TableCell className="font-medium">{formatBRL(Number(t.taxa))}</TableCell>
                  <TableCell>{t.valor_min_gratis !== null ? formatBRL(Number(t.valor_min_gratis)) : "—"}</TableCell>
                  <TableCell>
                    <Switch checked={t.ativo} onCheckedChange={(v) => toggleAtivo.mutate({ id: t.id, ativo: v })} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditItem(t); setDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                        if (confirm(`Remover faixa ${maskCep(t.cep_inicio)} — ${maskCep(t.cep_fim)}?`)) remove.mutate(t.id);
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}

function TaxaForm({ initial, onSubmit, loading }: { initial: Taxa | null; onSubmit: (v: any) => void; loading: boolean }) {
  const [cepInicio, setCepInicio] = useState(initial ? maskCep(initial.cep_inicio) : "");
  const [cepFim, setCepFim] = useState(initial ? maskCep(initial.cep_fim) : "");
  const [nomeRegiao, setNomeRegiao] = useState(initial?.nome_regiao ?? "");
  const [taxa, setTaxa] = useState(initial?.taxa?.toString() ?? "0");
  const [minGratis, setMinGratis] = useState(initial?.valor_min_gratis?.toString() ?? "");
  const [ordem, setOrdem] = useState(initial?.ordem ?? 0);
  const [ativo, setAtivo] = useState(initial?.ativo ?? true);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          ...(initial ? { id: initial.id } : {}),
          cep_inicio: cepInicio.replace(/\D/g, ""),
          cep_fim: cepFim.replace(/\D/g, ""),
          nome_regiao: nomeRegiao.trim() || null,
          taxa: Number(String(taxa).replace(",", ".")),
          valor_min_gratis: minGratis.trim() ? Number(String(minGratis).replace(",", ".")) : null,
          ordem,
          ativo,
        });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>CEP início *</Label>
          <Input
            placeholder="00000-000"
            value={cepInicio}
            onChange={(e) => setCepInicio(maskCep(e.target.value))}
            required
            minLength={9}
            maxLength={9}
          />
        </div>
        <div className="space-y-1">
          <Label>CEP fim *</Label>
          <Input
            placeholder="00000-000"
            value={cepFim}
            onChange={(e) => setCepFim(maskCep(e.target.value))}
            required
            minLength={9}
            maxLength={9}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Nome da região (opcional)</Label>
        <Input
          placeholder="Ex: Centro, Zona Sul..."
          value={nomeRegiao}
          onChange={(e) => setNomeRegiao(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Taxa (R$) *</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={taxa}
            onChange={(e) => setTaxa(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label>Frete grátis acima de (R$)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={minGratis}
            onChange={(e) => setMinGratis(e.target.value)}
            placeholder="deixe vazio = sem desconto"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 items-end">
        <div className="space-y-1">
          <Label>Ordem</Label>
          <Input
            type="number"
            value={ordem}
            onChange={(e) => setOrdem(Number(e.target.value))}
          />
        </div>
        <div className="flex items-center gap-2 pb-2">
          <Switch checked={ativo} onCheckedChange={setAtivo} />
          <Label>Ativo</Label>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
