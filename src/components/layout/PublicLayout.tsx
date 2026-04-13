import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Clock, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { useCart } from "@/contexts/CartContext";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useClienteSession } from "@/hooks/useClienteSession";
import ClienteLoginModal from "@/components/cliente/ClienteLoginModal";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { itemCount } = useCart();
  const { empresa, empresaId, slug } = useEmpresa();
  const { session, login, isLoggedIn } = useClienteSession();
  const [loginOpen, setLoginOpen] = useState(false);

  const { data: configs } = useQuery({
    queryKey: ["config-public", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/configuracoes`);
      const map: Record<string, string> = {};
      data?.forEach((c: any) => (map[c.chave] = c.valor));
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  const logoUrl = configs?.logo_url || empresa.logo_url || "";
  const temaConfig = configs?.tema_cardapio || "dark";
  const tempoEspera = configs?.tempo_espera || "";

  const [isDark, setIsDark] = useState(temaConfig !== "light");

  useEffect(() => {
    setIsDark(temaConfig !== "light");
  }, [temaConfig]);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("theme-light", "theme-dark");
    html.classList.add(isDark ? "theme-dark" : "theme-light");
    return () => {
      html.classList.remove("theme-light", "theme-dark");
    };
  }, [isDark]);

  const themeClass = isDark ? "theme-dark" : "theme-light";

  return (
    <div className={`${themeClass} min-h-screen flex flex-col bg-background text-foreground`}>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <Link to={`/loja/${slug}`} className="flex items-center">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-10 max-w-[200px] object-contain" />
            ) : (
              <span className="text-lg font-bold text-primary">{empresa.nome}</span>
            )}
          </Link>
          <div className="flex items-center gap-2">
            {tempoEspera && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {tempoEspera}
              </span>
            )}
            <ThemeToggle isDark={isDark} onToggle={setIsDark} />
            {isLoggedIn ? (
              <Link to={`/loja/${slug}/minha-conta`}>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                  <UserCircle className="h-5 w-5" />
                  <span className="hidden sm:inline">{session!.nome.split(" ")[0]}</span>
                </Button>
              </Link>
            ) : (
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setLoginOpen(true)}>
                <UserCircle className="h-5 w-5" />
              </Button>
            )}
            <Link to={`/loja/${slug}/carrinho`}>
              <Button variant="default" size="sm" className="relative gap-1.5 px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-shadow">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="font-bold text-sm">{itemCount}</span>
                )}
                {itemCount === 0 && (
                  <span className="text-sm font-medium hidden sm:inline">Carrinho</span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <ClienteLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={login} />
    </div>
  );
}
