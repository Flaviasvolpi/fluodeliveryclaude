import { Check } from "lucide-react";

const STEPS = [
  "Conta",
  "Dados",
  "Horários",
  "Pagamentos",
  "Pedidos",
  "Cardápio",
  "Config",
  "Pronto!",
];

export default function WizardProgress({ currentStep, completedSteps }: { currentStep: number; completedSteps: Set<number> }) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden sm:flex items-center justify-center gap-1 mb-8">
        {STEPS.map((label, i) => {
          const done = completedSteps.has(i);
          const active = i === currentStep;
          return (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  done ? "bg-primary border-primary text-primary-foreground" :
                  active ? "border-primary text-primary bg-primary/10" :
                  "border-muted-foreground/30 text-muted-foreground"
                }`}>
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-[10px] mt-1 ${active ? "text-primary font-semibold" : "text-muted-foreground"}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 mx-0.5 mt-[-12px] ${done ? "bg-primary" : "bg-muted-foreground/20"}`} />
              )}
            </div>
          );
        })}
      </div>
      {/* Mobile */}
      <div className="sm:hidden mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Passo {currentStep + 1} de {STEPS.length}</span>
          <span className="text-sm text-muted-foreground">{STEPS[currentStep]}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>
    </>
  );
}
