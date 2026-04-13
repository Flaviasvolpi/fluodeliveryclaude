import { useOrigem } from "@/contexts/OrigemContext";
import { MessageCircle, MessageSquare } from "lucide-react";

export default function BotaoVoltarAtendimento() {
  const { origem, voltarAtendimento } = useOrigem();

  if (!origem) return null;

  const isWhatsapp = origem === "whatsapp";

  return (
    <button
      onClick={voltarAtendimento}
      className={`
        fixed bottom-5 right-5 z-50
        flex items-center gap-2 px-4 py-3
        rounded-full font-medium text-sm
        shadow-lg cursor-pointer
        transition-all duration-300
        animate-in fade-in slide-in-from-bottom-4
        ${
          isWhatsapp
            ? "bg-[#25D366] hover:bg-[#1ebe5a] text-white"
            : "bg-primary hover:bg-primary/90 text-primary-foreground"
        }
      `}
    >
      {isWhatsapp ? <MessageCircle className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
      {isWhatsapp ? "Voltar ao WhatsApp" : "Voltar ao atendimento"}
    </button>
  );
}
