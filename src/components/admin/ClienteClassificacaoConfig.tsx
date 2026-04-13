import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Crown, UserCheck, UserMinus, UserX } from "lucide-react";
import { useClassificacaoConfig } from "@/hooks/useClienteClassificacao";

interface Props {
  onBack: () => void;
}

export default function ClienteClassificacaoConfig({ onBack }: Props) {
  const { config, isLoading, saveConfig, isSaving } = useClassificacaoConfig();
  const [form, setForm] = useState(config);

  useEffect(() => {
    setForm(config);
  }, [config]);

  const handleSave = () => {
    saveConfig(form);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <h2 className="text-2xl font-bold">Configurar Classificação</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="h-4 w-4 text-amber-500" /> VIP
            </CardTitle>
            <CardDescription>Alto gasto + alta frequência</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Mínimo de pedidos</Label>
              <Input
                type="number"
                min={1}
                value={form.vip_min_pedidos}
                onChange={(e) => setForm({ ...form, vip_min_pedidos: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Mínimo gasto (R$)</Label>
              <Input
                type="number"
                min={0}
                step={10}
                value={form.vip_min_gasto}
                onChange={(e) => setForm({ ...form, vip_min_gasto: Number(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCheck className="h-4 w-4 text-emerald-500" /> Frequente
            </CardTitle>
            <CardDescription>Compra com regularidade</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Mínimo de pedidos</Label>
              <Input
                type="number"
                min={1}
                value={form.frequente_min_pedidos}
                onChange={(e) => setForm({ ...form, frequente_min_pedidos: Number(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserX className="h-4 w-4 text-destructive" /> Perdido
            </CardTitle>
            <CardDescription>Não compra há X dias</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Dias sem comprar</Label>
              <Input
                type="number"
                min={1}
                value={form.perdido_dias}
                onChange={(e) => setForm({ ...form, perdido_dias: Number(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserMinus className="h-4 w-4 text-muted-foreground" /> Ocasional
            </CardTitle>
            <CardDescription>Todos que não se encaixam nas outras categorias</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Clientes que não atingem os critérios de VIP ou Frequente e que compraram nos últimos {form.perdido_dias} dias.
            </p>
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleSave} disabled={isSaving}>
        <Save className="h-4 w-4 mr-1" /> {isSaving ? "Salvando..." : "Salvar Configurações"}
      </Button>
    </div>
  );
}
