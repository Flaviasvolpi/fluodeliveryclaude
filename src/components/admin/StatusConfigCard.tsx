import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Save, ArrowUp, ArrowDown, ArrowRight, Plus, Trash2, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  useStatusConfig,
  LOCKED_STATUSES,
  COLOR_OPTIONS,
  getStatusClasses,
  getActiveStatusesForTipo,
  type StatusConfig,
} from "@/hooks/useStatusConfig";
import { useTiposConfig, getActiveTipos } from "@/hooks/useTiposConfig";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .substring(0, 40);
}

export default function StatusConfigCard() {
  const { empresaId } = useEmpresa();
  const queryClient = useQueryClient();
  const { data: configs } = useStatusConfig(empresaId);
  const { data: tipos } = useTiposConfig(empresaId);
  const [localConfigs, setLocalConfigs] = useState<StatusConfig[]>([]);
  const [novoLabel, setNovoLabel] = useState("");

  const activeTipos = tipos ? getActiveTipos(tipos) : [];
  const showTipos = activeTipos.length > 1;

  useEffect(() => {
    if (configs) setLocalConfigs([...configs]);
  }, [configs]);

  const salvar = useMutation({
    mutationFn: async () => {
      const rows = localConfigs.map((c, i) => ({
        status_key: c.status_key,
        label: c.label,
        cor: c.cor,
        ativo: c.ativo,
        ordem: i,
        tipos_aplicaveis: c.tipos_aplicaveis,
      }));
      await api.put(`/empresas/${empresaId}/pedido-status-config`, rows);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedido-status-config", empresaId] });
      toast.success("Status salvos!");
    },
    onError: () => toast.error("Erro ao salvar status."),
  });

  function updateField(index: number, field: keyof StatusConfig, value: any) {
    setLocalConfigs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function toggleTipo(index: number, tipo: string) {
    setLocalConfigs((prev) => {
      const next = [...prev];
      const current = next[index].tipos_aplicaveis;
      const has = current.includes(tipo);
      if (has && current.length <= 1) return prev;
      next[index] = {
        ...next[index],
        tipos_aplicaveis: has ? current.filter((t) => t !== tipo) : [...current, tipo],
      };
      return next;
    });
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= localConfigs.length) return;
    setLocalConfigs((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addStatus() {
    const label = novoLabel.trim();
    if (!label) {
      toast.error("Digite o nome do status.");
      return;
    }
    const key = slugify(label);
    if (!key) {
      toast.error("Nome inválido.");
      return;
    }
    if (localConfigs.some((c) => c.status_key === key)) {
      toast.error("Já existe um status com esse nome.");
      return;
    }
    const allTipoKeys = activeTipos.map((t) => t.tipo_key);
    setLocalConfigs((prev) => [
      ...prev,
      {
        status_key: key,
        label,
        cor: "blue",
        ativo: true,
        ordem: prev.length,
        tipos_aplicaveis: allTipoKeys.length > 0 ? allTipoKeys : ["retirada", "entrega", "mesa"],
      },
    ]);
    setNovoLabel("");
  }

  function removeStatus(index: number) {
    const cfg = localConfigs[index];
    if (LOCKED_STATUSES.includes(cfg.status_key)) return;
    setLocalConfigs((prev) => prev.filter((_, i) => i !== index));
  }

  if (!localConfigs.length) return null;

  return (
    <div className="space-y-5">
      {/* Status list */}
      <div className="space-y-2">
        {localConfigs.map((cfg, i) => {
          const locked = LOCKED_STATUSES.includes(cfg.status_key);
          return (
            <div key={cfg.status_key} className="rounded-lg border bg-card p-3 space-y-2">
              {/* Main row */}
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5 shrink-0">
                  <Button variant="ghost" size="icon" className="h-5 w-5" disabled={i === 0} onClick={() => moveItem(i, -1)}>
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5" disabled={i === localConfigs.length - 1} onClick={() => moveItem(i, 1)}>
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>

                <Switch checked={cfg.ativo} disabled={locked} onCheckedChange={(v) => updateField(i, "ativo", v)} />

                <Input className="h-8 w-36" value={cfg.label} onChange={(e) => updateField(i, "label", e.target.value)} />

                {/* Color selector */}
                <select
                  className="h-8 rounded-md border bg-secondary/50 px-2 text-xs"
                  value={cfg.cor}
                  onChange={(e) => updateField(i, "cor", e.target.value)}
                >
                  {COLOR_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>

                <Badge className={getStatusClasses(cfg.cor)}>{cfg.label}</Badge>

                {locked && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>Essencial para a API</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {!locked && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto text-destructive shrink-0" onClick={() => removeStatus(i)} title="Remover">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* Types row - only if multiple types exist */}
              {showTipos && (
                <div className="flex items-center gap-3 pl-12 text-xs text-muted-foreground">
                  <span>Tipos:</span>
                  {activeTipos.map((tipo) => (
                    <label key={tipo.tipo_key} className="flex items-center gap-1 cursor-pointer">
                      <Checkbox
                        checked={cfg.tipos_aplicaveis.includes(tipo.tipo_key)}
                        disabled={locked}
                        onCheckedChange={() => toggleTipo(i, tipo.tipo_key)}
                        className="h-3.5 w-3.5"
                      />
                      {tipo.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add new status - single input */}
      <div className="flex items-center gap-2 pt-2 border-t">
        <Input
          className="h-8 w-52"
          placeholder="Nome do novo status"
          value={novoLabel}
          onChange={(e) => setNovoLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addStatus()}
        />
        <Button size="sm" variant="outline" onClick={addStatus}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
        </Button>
      </div>

      {/* Flow preview */}
      {activeTipos.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground">Fluxo por tipo:</p>
          {activeTipos.map((tipo) => {
            const flow = getActiveStatusesForTipo(localConfigs, tipo.tipo_key);
            return (
              <div key={tipo.tipo_key} className="flex items-center gap-1 flex-wrap">
                <span className="text-xs font-semibold w-20">{tipo.label}:</span>
                {flow.map((s, idx) => (
                  <span key={s.status_key} className="flex items-center gap-1">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getStatusClasses(s.cor)}`}>{s.label}</Badge>
                    {idx < flow.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
        <Save className="mr-2 h-4 w-4" />
        {salvar.isPending ? "Salvando..." : "Salvar Status"}
      </Button>
    </div>
  );
}
