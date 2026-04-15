import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink, LayoutDashboard, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  empresaSlug: string;
  completedSteps: Set<number>;
}

const STEP_LABELS = ["Conta", "Dados", "Horários", "Pagamentos", "Tipos de Pedido", "Cardápio", "Configurações"];

export default function Step8Finalizar({ empresaSlug, completedSteps }: Props) {
  const navigate = useNavigate();

  return (
    <div className="text-center space-y-6 py-4">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold">Seu estabelecimento está pronto!</h2>
        <p className="text-muted-foreground mt-1">Tudo configurado. Você já pode começar a receber pedidos.</p>
      </div>

      {/* Resumo */}
      <div className="bg-muted/50 rounded-xl p-4 text-left max-w-sm mx-auto space-y-2">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            {completedSteps.has(i) ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-yellow-500 shrink-0" />
            )}
            <span className={completedSteps.has(i) ? "" : "text-muted-foreground"}>{label}</span>
            {!completedSteps.has(i) && <span className="text-xs text-yellow-600 ml-auto">configurar depois</span>}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-3 max-w-sm mx-auto">
        <Button className="w-full gap-2" size="lg" onClick={() => { localStorage.removeItem("onboarding"); navigate(`/admin/${empresaSlug}`); }}>
          <LayoutDashboard className="h-5 w-5" /> Acessar Painel de Gestão
        </Button>
        <Button variant="outline" className="w-full gap-2" size="lg" onClick={() => window.open(`/loja/${empresaSlug}`, "_blank")}>
          <ExternalLink className="h-5 w-5" /> Ver Cardápio Digital
        </Button>
        <Button variant="ghost" className="w-full gap-2 text-muted-foreground" size="sm" onClick={() => { localStorage.removeItem("onboarding"); navigate(`/admin/${empresaSlug}/ajuda`); }}>
          <HelpCircle className="h-4 w-4" /> Precisa de ajuda? Acesse o guia
        </Button>
      </div>
    </div>
  );
}
