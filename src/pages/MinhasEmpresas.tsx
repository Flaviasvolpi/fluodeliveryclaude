import { useQuery } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Store, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function MinhasEmpresas() {
  const { user, loading: authLoading, signOut } = useAuth();

  // Fetch empresas + roles + permissions in one combined query
  const { data, isLoading } = useQuery({
    queryKey: ["minhas-empresas-completo", user?.id],
    queryFn: async () => {
      // Get user roles
      const { data: roles } = await api.get(`/auth/me/roles`);

      const empresaIds = [...new Set(roles.map((r: any) => r.empresa_id))];
      if (empresaIds.length === 0) return { empresas: [], roles, permissoes: [] };

      // Fetch empresas and permissions in parallel
      const [empresasRes, ...permResponses] = await Promise.all([
        api.get(`/auth/me/empresas`),
        ...empresaIds.map((id: string) => api.get(`/empresas/${id}/perfil-permissoes`).catch(() => ({ data: [] }))),
      ]);

      const permissoes = permResponses.flatMap((r: any) => r.data || []);

      return {
        empresas: empresasRes.data,
        roles,
        permissoes,
      };
    },
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSkeleton lines={4} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const empresas = data?.empresas;
  const roles = data?.roles ?? [];
  const permissoes = data?.permissoes ?? [];

  // Helper: get first allowed tela for a specific empresa
  function getFirstTela(empresaId: string): string | null {
    const userRoles = roles
      .filter((r: any) => r.empresa_id === empresaId)
      .map((r: any) => r.role);

    // Admin goes to dashboard
    if (userRoles.includes("admin")) return null;

    const allowedTelas: string[] = [];
    for (const role of userRoles) {
      for (const p of permissoes) {
        if (p.empresa_id === empresaId && p.role === role && !allowedTelas.includes(p.tela_key)) {
          allowedTelas.push(p.tela_key);
        }
      }
    }

    return allowedTelas.length > 0 ? allowedTelas[0] : null;
  }

  function buildLink(empresa: { slug: string; id: string }) {
    const firstTela = getFirstTela(empresa.id);
    return firstTela
      ? `/admin/${empresa.slug}/${firstTela}`
      : `/admin/${empresa.slug}`;
  }

  // Auto-redirect if user has exactly one empresa
  if (empresas?.length === 1) {
    return <Navigate to={buildLink(empresas[0])} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Minhas Empresas</h1>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6 flex flex-col items-center gap-3">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !empresas?.length ? (
          <div className="text-center py-16 text-muted-foreground">
            <Store className="mx-auto h-12 w-12 mb-4 opacity-40" />
            <p>Você não tem acesso a nenhuma empresa.</p>
            <p className="text-sm mt-1">Entre em contato com um administrador.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {empresas.map((empresa: any) => (
              <Link key={empresa.id} to={buildLink(empresa)}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6 flex flex-col items-center gap-3">
                    {empresa.logo_url ? (
                      <img
                        src={empresa.logo_url}
                        alt={empresa.nome}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary">
                          {empresa.nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-lg font-semibold text-foreground">{empresa.nome}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
