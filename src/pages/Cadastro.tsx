import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import logoFluoDelivery from "@/assets/logo-fluodelivery.png";
import WizardProgress from "@/components/onboarding/WizardProgress";
import Step1CriarConta from "@/components/onboarding/Step1CriarConta";
import Step2DadosEstabelecimento from "@/components/onboarding/Step2DadosEstabelecimento";
import Step3Horarios from "@/components/onboarding/Step3Horarios";
import Step4FormasPagamento from "@/components/onboarding/Step4FormasPagamento";
import Step5TiposPedido from "@/components/onboarding/Step5TiposPedido";
import Step6Cardapio from "@/components/onboarding/Step6Cardapio";
import Step7Configuracoes from "@/components/onboarding/Step7Configuracoes";
import Step8Finalizar from "@/components/onboarding/Step8Finalizar";

interface OnboardingState {
  currentStep: number;
  empresaId: string | null;
  empresaSlug: string | null;
  completedSteps: number[];
}

function loadState(): OnboardingState {
  try {
    const saved = localStorage.getItem("onboarding");
    if (saved) return JSON.parse(saved);
  } catch {}
  return { currentStep: 0, empresaId: null, empresaSlug: null, completedSteps: [] };
}

function saveState(state: OnboardingState) {
  localStorage.setItem("onboarding", JSON.stringify(state));
}

export default function Cadastro() {
  const [state, setState] = useState<OnboardingState>(loadState);

  useEffect(() => { saveState(state); }, [state]);

  function completeStep(stepIndex: number) {
    setState((prev) => {
      const completed = new Set(prev.completedSteps);
      completed.add(stepIndex);
      return { ...prev, currentStep: stepIndex + 1, completedSteps: Array.from(completed) };
    });
  }

  function skipStep(stepIndex: number) {
    setState((prev) => ({ ...prev, currentStep: stepIndex + 1 }));
  }

  function goBack() {
    setState((prev) => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }));
  }

  function handleStep1Complete(data: { empresaId: string; empresaSlug: string }) {
    setState((prev) => {
      const completed = new Set(prev.completedSteps);
      completed.add(0);
      return { ...prev, currentStep: 1, empresaId: data.empresaId, empresaSlug: data.empresaSlug, completedSteps: Array.from(completed) };
    });
  }

  const completedSet = new Set(state.completedSteps);
  const empresaId = state.empresaId!;
  const empresaSlug = state.empresaSlug!;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="p-4">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar ao login
        </Link>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 pb-12 pt-4">
        <div className="w-full max-w-2xl space-y-4">
          {/* Logo */}
          <div className="text-center">
            <img src={logoFluoDelivery} alt="FluoDelivery" className="h-16 mx-auto mb-2" />
          </div>

          {/* Progress */}
          <WizardProgress currentStep={state.currentStep} completedSteps={completedSet} />

          {/* Step content */}
          <Card className="border shadow-lg">
            <CardContent className="pt-6 pb-6">
              {state.currentStep === 0 && <Step1CriarConta onComplete={handleStep1Complete} />}
              {state.currentStep === 1 && <Step2DadosEstabelecimento empresaId={empresaId} onComplete={() => completeStep(1)} onBack={goBack} />}
              {state.currentStep === 2 && <Step3Horarios empresaId={empresaId} onComplete={() => completeStep(2)} onBack={goBack} />}
              {state.currentStep === 3 && <Step4FormasPagamento empresaId={empresaId} onComplete={() => completeStep(3)} onBack={goBack} />}
              {state.currentStep === 4 && <Step5TiposPedido empresaId={empresaId} onComplete={() => completeStep(4)} onBack={goBack} />}
              {state.currentStep === 5 && <Step6Cardapio empresaId={empresaId} onComplete={() => completeStep(5)} onBack={goBack} />}
              {state.currentStep === 6 && <Step7Configuracoes empresaId={empresaId} onComplete={() => completeStep(6)} onBack={goBack} />}
              {state.currentStep === 7 && <Step8Finalizar empresaSlug={empresaSlug} completedSteps={completedSet} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
