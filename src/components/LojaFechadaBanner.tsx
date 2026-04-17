import { Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLojaAberta } from "@/hooks/useLojaAberta";

interface Props {
  empresaId: string;
  className?: string;
}

export default function LojaFechadaBanner({ empresaId, className }: Props) {
  const { aberta, loading, mensagem } = useLojaAberta(empresaId);
  if (loading || aberta) return null;

  return (
    <Alert variant="destructive" className={className}>
      <Clock className="h-4 w-4" />
      <AlertTitle>Loja fechada</AlertTitle>
      <AlertDescription>
        {mensagem} Você pode navegar pelo cardápio, mas novos pedidos só serão aceitos após a reabertura.
      </AlertDescription>
    </Alert>
  );
}
