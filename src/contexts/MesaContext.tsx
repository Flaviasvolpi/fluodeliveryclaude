import { createContext, useContext, useState, type ReactNode } from "react";

interface MesaContextData {
  mesaId: string | null;
  mesaNumero: number | null;
  mesaNome: string | null;
  setMesa: (id: string, numero: number, nome: string) => void;
  clearMesa: () => void;
}

const MesaContext = createContext<MesaContextData>({
  mesaId: null,
  mesaNumero: null,
  mesaNome: null,
  setMesa: () => {},
  clearMesa: () => {},
});

export function MesaProvider({ children }: { children: ReactNode }) {
  const [mesaId, setMesaId] = useState<string | null>(null);
  const [mesaNumero, setMesaNumero] = useState<number | null>(null);
  const [mesaNome, setMesaNome] = useState<string | null>(null);

  const setMesa = (id: string, numero: number, nome: string) => {
    setMesaId(id);
    setMesaNumero(numero);
    setMesaNome(nome);
  };

  const clearMesa = () => {
    setMesaId(null);
    setMesaNumero(null);
    setMesaNome(null);
  };

  return (
    <MesaContext.Provider value={{ mesaId, mesaNumero, mesaNome, setMesa, clearMesa }}>
      {children}
    </MesaContext.Provider>
  );
}

export function useMesa() {
  return useContext(MesaContext);
}
