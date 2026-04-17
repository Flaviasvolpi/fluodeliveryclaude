import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

interface Horario {
  dia_semana: number;
  hora_abrir: string;
  hora_fechar: string;
  ativo: boolean;
}

const DIAS_NOMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatHHMM(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function getProximaAbertura(horarios: Horario[], now: Date): Date | null {
  for (let delta = 0; delta < 8; delta++) {
    const d = new Date(now);
    d.setDate(d.getDate() + delta);
    const dia = d.getDay();
    const h = horarios.find((x) => x.dia_semana === dia && x.ativo);
    if (!h) continue;

    const [hh, mm] = h.hora_abrir.split(":").map(Number);
    if (delta === 0) {
      const nowMin = now.getHours() * 60 + now.getMinutes();
      if (toMinutes(h.hora_abrir) <= nowMin) continue;
    }
    d.setHours(hh || 0, mm || 0, 0, 0);
    return d;
  }
  return null;
}

export interface LojaStatus {
  aberta: boolean;
  loading: boolean;
  mensagem: string;
  horarioHoje?: Horario;
  proximaAbertura?: Date;
}

export function useLojaAberta(empresaId: string | undefined): LojaStatus {
  const { data, isLoading } = useQuery({
    queryKey: ["loja-horarios", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/horarios`);
      return data as Horario[];
    },
    enabled: !!empresaId,
    staleTime: 60 * 1000,
  });

  if (isLoading || !data) {
    return { aberta: true, loading: true, mensagem: "" };
  }

  // Sem horários cadastrados = considerar aberto (comportamento tolerante)
  if (!data.length) {
    return { aberta: true, loading: false, mensagem: "" };
  }

  const now = new Date();
  const diaHoje = now.getDay();
  const minutosAgora = now.getHours() * 60 + now.getMinutes();
  const horarioHoje = data.find((h) => h.dia_semana === diaHoje && h.ativo);

  if (horarioHoje) {
    const abre = toMinutes(horarioHoje.hora_abrir);
    const fecha = toMinutes(horarioHoje.hora_fechar);
    if (minutosAgora >= abre && minutosAgora < fecha) {
      return {
        aberta: true,
        loading: false,
        mensagem: `Aberto agora até ${horarioHoje.hora_fechar}`,
        horarioHoje,
      };
    }
  }

  const proxima = getProximaAbertura(data, now) ?? undefined;
  let mensagem = "A loja está fechada no momento.";
  if (proxima) {
    const hhmm = formatHHMM(proxima);
    const sameDay = proxima.toDateString() === now.toDateString();
    if (sameDay) {
      mensagem = `A loja está fechada. Reabre hoje às ${hhmm}.`;
    } else {
      mensagem = `A loja está fechada. Reabre ${DIAS_NOMES[proxima.getDay()]} às ${hhmm}.`;
    }
  } else if (horarioHoje) {
    mensagem = `A loja está fechada. Horário de hoje: ${horarioHoje.hora_abrir} às ${horarioHoje.hora_fechar}.`;
  }

  return {
    aberta: false,
    loading: false,
    mensagem,
    horarioHoje,
    proximaAbertura: proxima,
  };
}
