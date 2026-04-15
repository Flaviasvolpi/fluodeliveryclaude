import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingBag, Truck, UtensilsCrossed } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

const ICONS: Record<string, React.ElementType> = { retirada: ShoppingBag, entrega: Truck, mesa: UtensilsCrossed };
const DESCS: Record<string, string> = {
  retirada: "Cliente retira no balcão",
  entrega: "Pedido entregue no endereço do cliente",
  mesa: "Pedido feito na mesa do estabelecimento",
};

interface Props { empresaId: string; onComplete: () => void; }

export default function Step5TiposPedido({ empresaId, onComplete }: Props) {
  const [localTipos, setLocalTipos] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: tipos } = useQuery({
    queryKey: ["onboard-tipos", empresaId],
    queryFn: async () => { const { data } = await api.get(`/empresas/${empresaId}/pedido-tipos-config`); return data; },
  });

  const items = localTipos ?? tipos ?? [];

  function toggle(tipoKey: string) {
    setLocalTipos(items.map((t: any) => t.tipo_key === tipoKey ? { ...t, ativo: !t.ativo } : t));
  }

  async function handleSave() {
    setLoading(true);
    try {
      const rows = items.map((t: any, i: number) => ({ tipo_key: t.tipo_key, label: t.label, ativo: t.ativo, ordem: i }));
      await api.put(`/empresas/${empresaId}/pedido-tipos-config/bulk`, rows);
      onComplete();
    } catch { toast.error("Erro ao salvar"); }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">Tipos de pedido</h2>
        <p className="text-sm text-muted-foreground">Quais modalidades seu estabelecimento oferece?</p>
      </div>

      <div className="space-y-3">
        {items.map((t: any) => {
          const Icon = ICONS[t.tipo_key] ?? ShoppingBag;
          return (
            <div key={t.tipo_key} className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${t.ativo ? "border-primary/30 bg-primary/5" : "opacity-60"}`}>
              <Switch checked={t.ativo} onCheckedChange={() => toggle(t.tipo_key)} />
              <Icon className="h-6 w-6 text-primary shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{t.label}</span>
                  {t.ativo && <Badge variant="outline" className="text-xs">Ativo</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{DESCS[t.tipo_key] ?? ""}</p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">Você pode alterar isso depois em Configurações &gt; Tipos de Pedido</p>

      <Button className="w-full" size="lg" onClick={handleSave} disabled={loading || items.filter((t: any) => t.ativo).length === 0}>
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        Continuar
      </Button>
    </div>
  );
}
