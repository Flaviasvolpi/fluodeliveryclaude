import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  roles?: { role: string; empresaId: string; empresa: { id: string; nome: string; slug: string } }[];
}

async function fetchMe(): Promise<AuthUser | null> {
  const token = localStorage.getItem("access_token");
  if (!token) return null;

  try {
    const { data } = await api.get("/auth/me");
    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      roles: data.roles,
    };
  } catch {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    return null;
  }
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["auth-me"],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
  });

  const signIn = async (email: string, password: string) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      await queryClient.refetchQueries({ queryKey: ["auth-me"] });
      return { error: null };
    } catch (err: any) {
      return { error: { message: err.response?.data?.message || "Erro ao fazer login" } };
    }
  };

  const signOut = async () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    queryClient.clear();
    window.location.href = "/login";
  };

  const session = user ? { user } : null;

  return { user: user ?? null, session, loading: isLoading, signIn, signOut };
}
