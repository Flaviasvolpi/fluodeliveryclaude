import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket } from "lucide-react";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { formatBRL } from "@/lib/format";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/v1/cliente-auth`;

interface Cupom {
  id: string;
  codigo: string;
  tipo_desconto: string;
  valor_desconto: number;
  valor_minimo: number;
  valido_ate: string | null;
  uso_atual: number;
  uso_maximo: number;
}

export default function MeusCupons({ clienteId }: { clienteId: string }) {
  const { empresaId } = useEmpresa();
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/meus-cupons`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cliente_id: clienteId, empresa_id: empresaId }),
        });
        const data = await res.json();
        setCupons(data.cupons || []);
      } catch {
        toast.error("Erro ao carregar cupons");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [clienteId, empresaId]);

  if (loading) return <p className="text-center text-muted-foreground py-8">Carregando...</p>;
  if (cupons.length === 0) return <p className="text-center text-muted-foreground py-8">Nenhum cupom disponível.</p>;

  return (
    <div className="space-y-3">
      {cupons.map((c) => (
        <Card key={c.id}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Ticket className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-mono font-bold text-primary text-lg">{c.codigo}</p>
              <p className="text-sm text-muted-foreground">
                {c.tipo_desconto === "percentual"
                  ? `${c.valor_desconto}% de desconto`
                  : `${formatBRL(c.valor_desconto)} de desconto`}
                {c.valor_minimo > 0 && ` (mín. ${formatBRL(c.valor_minimo)})`}
              </p>
              {c.valido_ate && (
                <p className="text-xs text-muted-foreground">
                  Válido até {format(new Date(c.valido_ate), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              )}
            </div>
            <Badge variant="secondary">{c.uso_maximo - c.uso_atual}x restante</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
