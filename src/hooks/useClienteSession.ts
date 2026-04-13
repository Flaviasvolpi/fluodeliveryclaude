import { useState, useCallback } from "react";

interface ClienteSession {
  cliente_id: string;
  nome: string;
  telefone: string;
  empresa_id: string;
}

const STORAGE_KEY = "cliente_session";

export function useClienteSession() {
  const [session, setSession] = useState<ClienteSession | null>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((data: ClienteSession) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSession(data);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  return { session, login, logout, isLoggedIn: !!session };
}
