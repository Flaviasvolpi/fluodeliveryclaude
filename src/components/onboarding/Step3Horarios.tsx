import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const DEFAULTS = DIAS.map((_, i) => ({
  dia_semana: i,
  hora_abrir: i === 0 ? "12:00" : "08:00",
  hora_fechar: "22:00",
  ativo: i !== 0, // Domingo fechado por padrão
}));

interface Props { empresaId: string; onComplete: () => void; onBack?: () => void; }

export default function Step3Horarios({ empresaId, onComplete, onBack }: Props) {
  const [horarios, setHorarios] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);

  function update(i: number, field: string, value: any) {
    setHorarios((prev) => { const n = [...prev]; n[i] = { ...n[i], [field]: value }; return n; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/empresas/${empresaId}/horarios`, { horarios });
      onComplete();
    } catch { toast.error("Erro ao salvar horários"); }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">Horários de funcionamento</h2>
        <p className="text-sm text-muted-foreground">Defina quando seu estabelecimento está aberto</p>
      </div>

      <div className="space-y-3">
        {horarios.map((h, i) => (
          <div key={i} className="flex items-center gap-3">
            <Switch checked={h.ativo} onCheckedChange={(v) => update(i, "ativo", v)} />
            <span className="text-sm w-20 font-medium">{DIAS[i]}</span>
            <Input type="time" className="w-28 h-8" value={h.hora_abrir} disabled={!h.ativo} onChange={(e) => update(i, "hora_abrir", e.target.value)} />
            <span className="text-muted-foreground text-sm">até</span>
            <Input type="time" className="w-28 h-8" value={h.hora_fechar} disabled={!h.ativo} onChange={(e) => update(i, "hora_fechar", e.target.value)} />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">Voltar</Button>
        <Button type="submit" className="flex-1" size="lg" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        Continuar
      </Button>
    </form>
  );
}
