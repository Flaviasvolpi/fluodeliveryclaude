import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useUserRole } from "@/hooks/useUserRole";
import type { AppRole } from "@/types/database";

export interface PerfilPermissao {
  id: string;
  empresa_id: string;
  role: AppRole;
  tela_key: string;
}

export function usePerfilPermissoes() {
  const { empresa } = useEmpresa();

  const query = useQuery({
    queryKey: ["perfil-permissoes", empresa.id],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresa.id}/perfil-permissoes`);
      return data as PerfilPermissao[];
    },
  });

  const permissoesPorRole: Record<string, string[]> = {};
  for (const p of query.data ?? []) {
    if (!permissoesPorRole[p.role]) permissoesPorRole[p.role] = [];
    permissoesPorRole[p.role].push(p.tela_key);
  }

  return { ...query, permissoesPorRole };
}

export function useUserTelas(userId: string | undefined) {
  const { data: roles, isLoading: rolesLoading } = useUserRole(userId);
  const { permissoesPorRole, isLoading: permLoading } = usePerfilPermissoes();

  const isAdmin = roles?.includes("admin") ?? false;

  const telas: string[] = [];
  if (!isAdmin && roles) {
    for (const role of roles) {
      const telasRole = permissoesPorRole[role] ?? [];
      for (const t of telasRole) {
        if (!telas.includes(t)) telas.push(t);
      }
    }
  }

  return {
    isAdmin,
    telas,
    isLoading: rolesLoading || permLoading,
  };
}
