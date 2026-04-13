import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  roles?: { role: string; empresaId: string; empresa: { id: string; nome: string; slug: string } }[];
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get("/auth/me");
      setUser({
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        roles: data.roles,
      });
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      await loadUser();
      return { error: null };
    } catch (err: any) {
      return { error: { message: err.response?.data?.message || "Erro ao fazer login" } };
    }
  };

  const signOut = async () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  // Compatibility: expose user.id as session-like
  const session = user ? { user } : null;

  return { user, session, loading, signIn, signOut };
}
