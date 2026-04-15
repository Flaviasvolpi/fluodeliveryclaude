import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface Props { empresaId: string; onComplete: () => void; }

export default function Step4FormasPagamento({ empresaId, onComplete }: Props) {
  const [novaForma, setNovaForma] = useState("");
  const [exigeTroco, setExigeTroco] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: formas, refetch } = useQuery({
    queryKey: ["onboard-formas", empresaId],
    queryFn: async () => { const { data } = await api.get(`/empresas/${empresaId}/formas-pagamento`); return data; },
  });

  async function toggleAtivo(id: string, ativo: boolean) {
    await api.patch(`/empresas/${empresaId}/formas-pagamento/${id}`, { ativo });
    refetch();
  }

  async function addForma() {
    if (!novaForma.trim()) return;
    await api.post(`/empresas/${empresaId}/formas-pagamento`, { nome: novaForma.trim(), exige_troco: exigeTroco });
    setNovaForma(""); setExigeTroco(false); refetch();
    toast.success("Forma de pagamento adicionada");
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">Formas de pagamento</h2>
        <p className="text-sm text-muted-foreground">Ative as formas que seu estabelecimento aceita</p>
      </div>

      <div className="space-y-2">
        {formas?.map((f: any) => (
          <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border">
            <span className="font-medium">{f.nome}</span>
            <Switch checked={f.ativo} onCheckedChange={(v) => toggleAtivo(f.id, v)} />
          </div>
        ))}
      </div>

      <div className="border-t pt-3 space-y-2">
        <Label className="text-sm text-muted-foreground">Adicionar outra forma:</Label>
        <div className="flex gap-2">
          <Input value={novaForma} onChange={(e) => setNovaForma(e.target.value)} placeholder="Ex: Vale Refeição" className="flex-1" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addForma())} />
          <Button type="button" variant="outline" onClick={addForma} disabled={!novaForma.trim()}><Plus className="h-4 w-4" /></Button>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={exigeTroco} onCheckedChange={setExigeTroco} id="troco" />
          <Label htmlFor="troco" className="text-sm">Exige troco</Label>
        </div>
      </div>

      <Button className="w-full" size="lg" onClick={onComplete} disabled={loading}>
        Continuar
      </Button>
    </div>
  );
}
