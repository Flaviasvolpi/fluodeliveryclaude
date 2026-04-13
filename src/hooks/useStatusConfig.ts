import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface StatusConfig {
  status_key: string;
  label: string;
  cor: string;
  ativo: boolean;
  ordem: number;
  tipos_aplicaveis: string[];
}

const ALL_TIPOS: string[] = ["retirada", "entrega", "mesa"];

const DEFAULT_STATUS_CONFIG: StatusConfig[] = [
  { status_key: "novo", label: "Novo", cor: "blue", ativo: true, ordem: 0, tipos_aplicaveis: ALL_TIPOS },
  { status_key: "confirmado", label: "Confirmado", cor: "yellow", ativo: true, ordem: 1, tipos_aplicaveis: ALL_TIPOS },
  { status_key: "preparo", label: "Em Preparo", cor: "orange", ativo: true, ordem: 2, tipos_aplicaveis: ALL_TIPOS },
  { status_key: "pronto", label: "Pronto", cor: "green", ativo: true, ordem: 3, tipos_aplicaveis: ALL_TIPOS },
  { status_key: "saiu_entrega", label: "Saiu p/ Entrega", cor: "purple", ativo: true, ordem: 4, tipos_aplicaveis: ["entrega"] },
  { status_key: "entregue", label: "Entregue", cor: "gray", ativo: true, ordem: 5, tipos_aplicaveis: ALL_TIPOS },
];

export const LOCKED_STATUSES: string[] = ["novo", "pronto", "saiu_entrega", "entregue"];
export const API_STATUSES: string[] = LOCKED_STATUSES;

export const COLOR_OPTIONS = [
  { value: "blue", label: "Azul", classes: "bg-blue-100 text-blue-800 border border-blue-200" },
  { value: "yellow", label: "Amarelo", classes: "bg-yellow-100 text-yellow-800 border border-yellow-200" },
  { value: "orange", label: "Laranja", classes: "bg-orange-100 text-orange-800 border border-orange-200" },
  { value: "green", label: "Verde", classes: "bg-green-100 text-green-800 border border-green-200" },
  { value: "purple", label: "Roxo", classes: "bg-purple-100 text-purple-800 border border-purple-200" },
  { value: "gray", label: "Cinza", classes: "bg-gray-100 text-gray-700 border border-gray-200" },
  { value: "red", label: "Vermelho", classes: "bg-red-100 text-red-800 border border-red-200" },
];

export function getStatusClasses(cor: string): string {
  return COLOR_OPTIONS.find((c) => c.value === cor)?.classes ?? "bg-muted text-muted-foreground";
}

export function useStatusConfig(empresaId: string) {
  return useQuery({
    queryKey: ["pedido-status-config", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/pedido-status-config`);
      if (!data || data.length === 0) return DEFAULT_STATUS_CONFIG;
      return data.map((d: any) => ({
        status_key: d.statusKey ?? d.status_key,
        label: d.label,
        cor: d.cor,
        ativo: d.ativo,
        ordem: d.ordem,
        tipos_aplicaveis: d.tiposAplicaveis ?? d.tipos_aplicaveis ?? ALL_TIPOS,
      }));
    },
    enabled: !!empresaId,
  });
}

export function getActiveStatuses(configs: StatusConfig[]): StatusConfig[] {
  return configs
    .filter((c) => c.ativo && c.status_key !== "cancelado")
    .sort((a, b) => a.ordem - b.ordem);
}

export function getActiveStatusesForTipo(configs: StatusConfig[], tipo: string): StatusConfig[] {
  return configs
    .filter((c) => c.ativo && c.status_key !== "cancelado" && (c.tipos_aplicaveis ?? ALL_TIPOS).includes(tipo))
    .sort((a, b) => a.ordem - b.ordem);
}

export function getNextStatusForTipo(configs: StatusConfig[], current: string, tipo: string): string | null {
  const flow = getActiveStatusesForTipo(configs, tipo).map((s) => s.status_key);
  const idx = flow.indexOf(current);
  if (idx < 0 || idx >= flow.length - 1) return null;
  return flow[idx + 1];
}

export function getStatusLabel(configs: StatusConfig[], key: string): string {
  return configs.find((c) => c.status_key === key)?.label ?? key;
}

export { DEFAULT_STATUS_CONFIG, ALL_TIPOS };
