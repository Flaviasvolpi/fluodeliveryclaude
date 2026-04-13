import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useEmpresa } from "@/contexts/EmpresaContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, ArrowUp, ArrowDown, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useTiposConfig, type TipoConfig } from "@/hooks/useTiposConfig";

function slugify(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

export default function TiposPedido() {
  const { empresaId } = useEmpresa();
  const queryClient = useQueryClient();
  const { data: tipos } = useTiposConfig(empresaId);
  const [localTipos, setLocalTipos] = useState<TipoConfig[]>([]);
  const [novoLabel, setNovoLabel] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (tipos) setLocalTipos([...tipos]);
  }, [tipos]);

  const salvar = useMutation({
    mutationFn: async () => {
      const rows = localTipos.map((t, i) => ({
        empresa_id: empresaId,
        tipo_key: t.tipo_key,
        label: t.label,
        ativo: t.ativo,
        ordem: i,
        origem: t.origem,
        exige_endereco: t.exige_endereco,
        exige_mesa: t.exige_mesa,
        exige_referencia: t.exige_referencia,
        referencia_auto: t.referencia_auto,
        referencia_label: t.referencia_label,
      }));
      await api.put(`/empresas/${empresaId}/pedido-tipos-config/bulk`, rows);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedido-tipos-config", empresaId] });
      toast.success("Tipos salvos!");
    },
    onError: () => toast.error("Erro ao salvar tipos."),
  });

  function addTipo() {
    const label = novoLabel.trim();
    if (!label) { toast.error("Preencha o nome do tipo."); return; }
    const key = slugify(label);
    if (localTipos.some((t) => t.tipo_key === key)) { toast.error("Já existe um tipo com esse nome."); return; }
    setLocalTipos((prev) => [...prev, {
      tipo_key: key, label, ativo: true, ordem: prev.length,
      origem: "interno", exige_endereco: false, exige_mesa: false,
      exige_referencia: false, referencia_auto: false, referencia_label: "",
    }]);
    setNovoLabel("");
  }

  function removeTipo(index: number) {
    setLocalTipos((prev) => prev.filter((_, i) => i !== index));
    if (expandedIndex === index) setExpandedIndex(null);
  }

  function updateField(index: number, field: keyof TipoConfig, value: any) {
    setLocalTipos((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= localTipos.length) return;
    setLocalTipos((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  const origemLabels: Record<string, string> = { online: "Cardápio online", interno: "Atendimento interno", ambos: "Ambos" };

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-6">
        <h2 className="text-xl font-bold">Tipos de Pedido</h2>
        <p className="text-sm text-muted-foreground">
          Configure os tipos de pedido e seu comportamento (retirada, entrega, mesa, comanda, senha...).
        </p>

        <div className="space-y-2">
          {localTipos.map((t, i) => (
            <div key={t.tipo_key} className="rounded-lg border bg-card">
              {/* Main row */}
              <div className="flex items-center gap-2 p-3">
                <div className="flex flex-col gap-0.5">
                  <Button variant="ghost" size="icon" className="h-5 w-5" disabled={i === 0} onClick={() => moveItem(i, -1)}>
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5" disabled={i === localTipos.length - 1} onClick={() => moveItem(i, 1)}>
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
                <Switch checked={t.ativo} onCheckedChange={(v) => updateField(i, "ativo", v)} />
                <Input className="h-8 w-40" value={t.label} onChange={(e) => updateField(i, "label", e.target.value)} />
                <Badge variant="outline" className="text-xs shrink-0">{origemLabels[t.origem] ?? t.origem}</Badge>
                <Button
                  variant="ghost" size="sm" className="ml-auto h-7 px-2 text-xs gap-1"
                  onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                >
                  {expandedIndex === i ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  Config
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 p-0 text-destructive" onClick={() => removeTipo(i)} title="Remover">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Expanded config */}
              {expandedIndex === i && (
                <div className="px-4 pb-4 pt-1 border-t space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Disponibilidade</Label>
                      <select
                        className="w-full h-8 rounded-md border bg-background px-2 text-sm"
                        value={t.origem}
                        onChange={(e) => updateField(i, "origem", e.target.value)}
                      >
                        <option value="online">Cardápio online</option>
                        <option value="interno">Atendimento interno</option>
                        <option value="ambos">Ambos</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <label className="flex items-center gap-2 text-sm">
                      <Switch checked={t.exige_endereco} onCheckedChange={(v) => updateField(i, "exige_endereco", v)} />
                      Exige endereço
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Switch checked={t.exige_mesa} onCheckedChange={(v) => updateField(i, "exige_mesa", v)} />
                      Exige seleção de mesa
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Switch checked={t.exige_referencia} onCheckedChange={(v) => updateField(i, "exige_referencia", v)} />
                      Exige referência
                    </label>
                  </div>
                  {t.exige_referencia && (
                    <div className="flex items-center gap-4 pl-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Rótulo do campo</Label>
                        <Input className="h-8 w-40" placeholder="ex: Nº Comanda" value={t.referencia_label} onChange={(e) => updateField(i, "referencia_label", e.target.value)} />
                      </div>
                      <label className="flex items-center gap-2 text-sm mt-5">
                        <Switch checked={t.referencia_auto} onCheckedChange={(v) => updateField(i, "referencia_auto", v)} />
                        Auto-gerar
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-end gap-2 pt-2 border-t">
          <div className="space-y-1">
            <Label className="text-xs">Nome do novo tipo</Label>
            <Input className="h-8 w-48" placeholder="ex: Comanda" value={novoLabel} onChange={(e) => setNovoLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTipo()} />
          </div>
          <Button size="sm" variant="outline" onClick={addTipo}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
          </Button>
        </div>

        <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {salvar.isPending ? "Salvando..." : "Salvar Tipos"}
        </Button>
      </div>
    </AdminLayout>
  );
}
