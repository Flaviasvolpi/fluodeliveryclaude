import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

export type OrigemType = "whatsapp" | "widget" | null;

interface OrigemContextData {
  origem: OrigemType;
  phone: string | null;
  conversationId: string | null;
  voltarAtendimento: () => void;
}

const KEYS = {
  origem: "atendimento_origem",
  phone: "atendimento_phone",
  conversationId: "atendimento_conversation_id",
} as const;

function readSession(): { origem: OrigemType; phone: string | null; conversationId: string | null } {
  const o = sessionStorage.getItem(KEYS.origem);
  return {
    origem: o === "whatsapp" || o === "widget" ? o : null,
    phone: sessionStorage.getItem(KEYS.phone),
    conversationId: sessionStorage.getItem(KEYS.conversationId),
  };
}

const OrigemContext = createContext<OrigemContextData>({
  origem: null,
  phone: null,
  conversationId: null,
  voltarAtendimento: () => {},
});

export function OrigemProvider({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState(readSession);

  useEffect(() => {
    const param = searchParams.get("origem");
    if (param === "whatsapp" || param === "widget") {
      const phone = searchParams.get("phone");
      const conversationId = searchParams.get("conversation_id");

      sessionStorage.setItem(KEYS.origem, param);
      if (phone) sessionStorage.setItem(KEYS.phone, phone);
      if (conversationId) sessionStorage.setItem(KEYS.conversationId, conversationId);

      setState({ origem: param, phone, conversationId });
    }
  }, [searchParams]);

  const voltarAtendimento = useCallback(() => {
    if (state.origem === "whatsapp" && state.phone) {
      window.open(`https://wa.me/${state.phone.replace(/\D/g, "")}`, "_blank");
    } else if (state.origem === "widget") {
      const msg = { type: "fechar-cardapio" };
      // Inside iframe → notify parent
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(msg, "*");
      }
      // Opened via window.open → notify opener and close
      else if (window.opener) {
        try { window.opener.postMessage(msg, "*"); } catch {}
        window.close();
      }
      // Fallback: try closing or go back
      else {
        window.close();
        // window.close() may be blocked if not opened by script
        setTimeout(() => {
          if (window.history.length > 1) window.history.back();
        }, 300);
      }
    }
  }, [state.origem, state.phone]);

  return (
    <OrigemContext.Provider value={{ ...state, voltarAtendimento }}>
      {children}
    </OrigemContext.Provider>
  );
}

export function useOrigem() {
  return useContext(OrigemContext);
}
