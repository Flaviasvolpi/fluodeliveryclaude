import { Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { EmpresaContext } from "@/contexts/EmpresaContext";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import type { AppRole } from "@/types/database";

interface Empresa {
  id: string;
  nome: string;
  slug: string;
  telefone: string | null;
  logo_url: string | null;
  banner_url: string | null;
  ativo: boolean;
  [key: string]: any;
}

interface PerfilPermissao {
  id: string;
  empresa_id: string;
  role: AppRole;
  tela_key: string;
}

interface Props {
  children: React.ReactNode;
  telaKey?: string;
}

export default function AdminGate({ children, telaKey }: Props) {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();

  const empresaQuery = useQuery({
    queryKey: ["empresa", slug],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/by-slug/${slug}`);
      return data as Empresa;
    },
    enabled: !!slug,
  });

  const empresaId = empresaQuery.data?.id;

  const permQuery = useQuery({
    queryKey: ["perfil-permissoes", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/perfil-permissoes`);
      return data as PerfilPermissao[];
    },
    enabled: !!empresaId,
  });

  const isLoading =
    authLoading ||
    empresaQuery.isLoading ||
    (!!empresaId && permQuery.isLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSkeleton lines={4} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (empresaQuery.error || !empresaQuery.data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Empresa não encontrada</h1>
          <p className="text-muted-foreground">O endereço informado não corresponde a nenhuma empresa ativa.</p>
        </div>
      </div>
    );
  }

  const empresa = empresaQuery.data;
  const roles = (user.roles ?? [])
    .filter((r: any) => (r.empresa_id ?? r.empresaId) === empresa.id)
    .map((r: any) => r.role as AppRole);
  const isAdmin = roles.includes("admin" as AppRole);

  const telas: string[] = [];
  if (!isAdmin) {
    const permissoes = permQuery.data ?? [];
    for (const role of roles) {
      for (const p of permissoes) {
        if (p.role === role && !telas.includes(p.tela_key)) {
          telas.push(p.tela_key);
        }
      }
    }
  }

  if (!isAdmin && telaKey && !telas.includes(telaKey)) {
    if (telas.length > 0 && slug) {
      return <Navigate to={`/admin/${slug}/${telas[0]}`} replace />;
    }
    return <Navigate to="/admin" replace />;
  }

  return (
    <EmpresaContext.Provider value={{ empresa, empresaId: empresa.id, slug: empresa.slug }}>
      {children}
    </EmpresaContext.Provider>
  );
}
