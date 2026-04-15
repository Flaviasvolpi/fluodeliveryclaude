import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface Props { empresaId: string; onComplete: () => void; onBack?: () => void; }

export default function Step7Configuracoes({ empresaId, onComplete, onBack }: Props) {
  const [taxaEntrega, setTaxaEntrega] = useState("5.00");
  const [tempoEspera, setTempoEspera] = useState("30-45 min");
  const [tema, setTema] = useState("dark");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/empresas/${empresaId}/configuracoes`, { chave: "taxa_entrega_padrao", valor: taxaEntrega });
      await api.post(`/empresas/${empresaId}/configuracoes`, { chave: "tempo_espera", valor: tempoEspera });
      await api.post(`/empresas/${empresaId}/configuracoes`, { chave: "tema_cardapio", valor: tema });
      onComplete();
    } catch { toast.error("Erro ao salvar configurações"); }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">Configurações básicas</h2>
        <p className="text-sm text-muted-foreground">Ajustes finais para seu cardápio digital</p>
      </div>

      <div className="space-y-1">
        <Label>Taxa de entrega padrão (R$) *</Label>
        <Input type="number" step="0.01" min="0" value={taxaEntrega} onChange={(e) => setTaxaEntrega(e.target.value)} placeholder="5.00" required />
        <p className="text-xs text-muted-foreground">Pode ser alterada por pedido depois</p>
      </div>

      <div className="space-y-1">
        <Label>Tempo médio de espera *</Label>
        <Input value={tempoEspera} onChange={(e) => setTempoEspera(e.target.value)} placeholder="30-45 min" required />
        <p className="text-xs text-muted-foreground">Exibido no cardápio para o cliente</p>
      </div>

      <div className="space-y-2">
        <Label>Tema do cardápio digital *</Label>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setTema("light")} className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${tema === "light" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"}`}>
            <Sun className="h-8 w-8" />
            <span className="text-sm font-medium">Claro</span>
          </button>
          <button type="button" onClick={() => setTema("dark")} className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${tema === "dark" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"}`}>
            <Moon className="h-8 w-8" />
            <span className="text-sm font-medium">Escuro</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">Voltar</Button>
        <Button type="submit" className="flex-1" size="lg" disabled={loading || !taxaEntrega || !tempoEspera}>
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        Continuar
      </Button>
    </form>
  );
}
