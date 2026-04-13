import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { toast } from "sonner";

export type Classificacao = "vip" | "frequente" | "ocasional" | "perdido";

export interface ClassificacaoConfig {
  vip_min_pedidos: number;
  vip_min_gasto: number;
  frequente_min_pedidos: number;
  perdido_dias: number;
}

const DEFAULT_CONFIG: ClassificacaoConfig = {
  vip_min_pedidos: 10,
  vip_min_gasto: 500,
  frequente_min_pedidos: 5,
  perdido_dias: 30,
};

const KEYS = [
  "cliente_vip_min_pedidos",
  "cliente_vip_min_gasto",
  "cliente_frequente_min_pedidos",
  "cliente_perdido_dias",
] as const;

export function useClassificacaoConfig() {
  const { empresaId } = useEmpresa();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["classificacao-config", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/configuracoes`);
      const map = new Map((data ?? []).map((d: any) => [d.chave, d.valor]));
      return {
        vip_min_pedidos: Number(map.get("cliente_vip_min_pedidos")) || DEFAULT_CONFIG.vip_min_pedidos,
        vip_min_gasto: Number(map.get("cliente_vip_min_gasto")) || DEFAULT_CONFIG.vip_min_gasto,
        frequente_min_pedidos: Number(map.get("cliente_frequente_min_pedidos")) || DEFAULT_CONFIG.frequente_min_pedidos,
        perdido_dias: Number(map.get("cliente_perdido_dias")) || DEFAULT_CONFIG.perdido_dias,
      } as ClassificacaoConfig;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (newConfig: ClassificacaoConfig) => {
      const entries = [
        { chave: "cliente_vip_min_pedidos", valor: String(newConfig.vip_min_pedidos) },
        { chave: "cliente_vip_min_gasto", valor: String(newConfig.vip_min_gasto) },
        { chave: "cliente_frequente_min_pedidos", valor: String(newConfig.frequente_min_pedidos) },
        { chave: "cliente_perdido_dias", valor: String(newConfig.perdido_dias) },
      ];

      for (const entry of entries) {
        await api.post(`/empresas/${empresaId}/configuracoes`, entry);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classificacao-config", empresaId] });
      toast.success("Configurações de classificação salvas!");
    },
    onError: () => {
      toast.error("Erro ao salvar configurações");
    },
  });

  return { config: config ?? DEFAULT_CONFIG, isLoading, saveConfig: saveMutation.mutate, isSaving: saveMutation.isPending };
}

export function classificarCliente(
  config: ClassificacaoConfig,
  totalPedidos: number,
  totalGasto: number,
  ultimoPedido: string | null
): Classificacao {
  if (ultimoPedido) {
    const dias = Math.floor((Date.now() - new Date(ultimoPedido).getTime()) / (1000 * 60 * 60 * 24));
    if (dias >= config.perdido_dias && totalPedidos > 0) return "perdido";
  } else if (totalPedidos > 0) {
    return "perdido";
  }

  if (totalPedidos >= config.vip_min_pedidos && totalGasto >= config.vip_min_gasto) return "vip";
  if (totalPedidos >= config.frequente_min_pedidos) return "frequente";

  return "ocasional";
}

export const CLASSIFICACAO_LABELS: Record<Classificacao, string> = {
  vip: "VIP",
  frequente: "Frequente",
  ocasional: "Ocasional",
  perdido: "Perdido",
};

export const CLASSIFICACAO_COLORS: Record<Classificacao, string> = {
  vip: "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30",
  frequente: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  ocasional: "bg-muted text-muted-foreground border-border",
  perdido: "bg-destructive/20 text-destructive border-destructive/30",
};
