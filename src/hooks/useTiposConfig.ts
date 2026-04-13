import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface TipoConfig {
  id?: string;
  tipo_key: string;
  label: string;
  ativo: boolean;
  ordem: number;
  origem: "online" | "interno" | "ambos";
  exige_endereco: boolean;
  exige_mesa: boolean;
  exige_referencia: boolean;
  referencia_auto: boolean;
  referencia_label: string;
}

const DEFAULT_TIPOS: TipoConfig[] = [
  { tipo_key: "retirada", label: "Retirada", ativo: true, ordem: 0, origem: "online", exige_endereco: false, exige_mesa: false, exige_referencia: false, referencia_auto: false, referencia_label: "" },
  { tipo_key: "entrega", label: "Entrega", ativo: true, ordem: 1, origem: "online", exige_endereco: true, exige_mesa: false, exige_referencia: false, referencia_auto: false, referencia_label: "" },
  { tipo_key: "mesa", label: "Mesa", ativo: true, ordem: 2, origem: "interno", exige_endereco: false, exige_mesa: true, exige_referencia: false, referencia_auto: false, referencia_label: "" },
];

export function useTiposConfig(empresaId: string) {
  return useQuery({
    queryKey: ["pedido-tipos-config", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/pedido-tipos-config`);
      if (!data || data.length === 0) return DEFAULT_TIPOS;
      return data.map((d: any) => ({
        id: d.id,
        tipo_key: d.tipoKey ?? d.tipo_key,
        label: d.label,
        ativo: d.ativo,
        ordem: d.ordem,
        origem: d.origem ?? "online",
        exige_endereco: d.exigeEndereco ?? d.exige_endereco ?? false,
        exige_mesa: d.exigeMesa ?? d.exige_mesa ?? false,
        exige_referencia: d.exigeReferencia ?? d.exige_referencia ?? false,
        referencia_auto: d.referenciaAuto ?? d.referencia_auto ?? false,
        referencia_label: d.referenciaLabel ?? d.referencia_label ?? "",
      }));
    },
    enabled: !!empresaId,
  });
}

export function getActiveTipos(tipos: TipoConfig[]): TipoConfig[] {
  return tipos.filter((t) => t.ativo).sort((a, b) => a.ordem - b.ordem);
}

export function getOnlineTipos(tipos: TipoConfig[]): TipoConfig[] {
  return getActiveTipos(tipos).filter((t) => t.origem === "online" || t.origem === "ambos");
}

export function getInternoTipos(tipos: TipoConfig[]): TipoConfig[] {
  return getActiveTipos(tipos).filter((t) => t.origem === "interno" || t.origem === "ambos");
}

export { DEFAULT_TIPOS };
