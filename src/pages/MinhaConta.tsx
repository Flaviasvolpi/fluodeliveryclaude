import PublicLayout from "@/components/layout/PublicLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClienteSession } from "@/hooks/useClienteSession";
import ClienteLoginModal from "@/components/cliente/ClienteLoginModal";
import MeusPedidos from "@/components/cliente/MeusPedidos";
import MeusCupons from "@/components/cliente/MeusCupons";
import MeusEnderecos from "@/components/cliente/MeusEnderecos";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useState } from "react";

export default function MinhaConta() {
  const { session, login, logout, isLoggedIn } = useClienteSession();
  const [loginOpen, setLoginOpen] = useState(!isLoggedIn);

  if (!isLoggedIn) {
    return (
      <PublicLayout>
        <div className="container max-w-md mx-auto py-12 px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Minha Conta</h1>
          <p className="text-muted-foreground mb-6">
            Identifique-se para ver seus pedidos, cupons e endereços salvos.
          </p>
          <Button onClick={() => setLoginOpen(true)}>Entrar ou Criar Conta</Button>
          <ClienteLoginModal
            open={loginOpen}
            onClose={() => setLoginOpen(false)}
            onSuccess={login}
          />
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container max-w-2xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Olá, {session!.nome}!</h1>
            <p className="text-sm text-muted-foreground">Gerencie sua conta</p>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5 text-muted-foreground">
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>

        <Tabs defaultValue="pedidos">
          <TabsList className="w-full">
            <TabsTrigger value="pedidos" className="flex-1">Pedidos</TabsTrigger>
            <TabsTrigger value="cupons" className="flex-1">Cupons</TabsTrigger>
            <TabsTrigger value="enderecos" className="flex-1">Endereços</TabsTrigger>
          </TabsList>
          <TabsContent value="pedidos">
            <MeusPedidos clienteId={session!.cliente_id} />
          </TabsContent>
          <TabsContent value="cupons">
            <MeusCupons clienteId={session!.cliente_id} />
          </TabsContent>
          <TabsContent value="enderecos">
            <MeusEnderecos clienteId={session!.cliente_id} />
          </TabsContent>
        </Tabs>
      </div>
    </PublicLayout>
  );
}
