import { createContext, useContext, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

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

interface EmpresaContextData {
  empresa: Empresa;
  empresaId: string;
  slug: string;
}

export const EmpresaContext = createContext<EmpresaContextData | null>(null);

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const { slug } = useParams<{ slug: string }>();

  const { data: empresa, isLoading, error } = useQuery({
    queryKey: ["empresa", slug],
    queryFn: async () => {
      if (!slug) throw new Error("Slug não informado");
      const { data } = await api.get(`/empresas/by-slug/${slug}`);
      return data as Empresa;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSkeleton lines={4} />
      </div>
    );
  }

  if (error || !empresa) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Empresa não encontrada</h1>
          <p className="text-muted-foreground">O endereço informado não corresponde a nenhuma empresa ativa.</p>
        </div>
      </div>
    );
  }

  return (
    <EmpresaContext.Provider value={{ empresa, empresaId: empresa.id, slug: empresa.slug }}>
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa() {
  const ctx = useContext(EmpresaContext);
  if (!ctx) throw new Error("useEmpresa must be used within EmpresaProvider");
  return ctx;
}
