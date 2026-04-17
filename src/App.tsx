import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { OrigemProvider } from "@/contexts/OrigemContext";
import { EmpresaProvider } from "@/contexts/EmpresaContext";
import { MesaProvider } from "@/contexts/MesaContext";

import ProtectedRoute from "@/components/ProtectedRoute";
import AdminGate from "@/components/AdminGate";
import Index from "./pages/Index";
import Carrinho from "./pages/Carrinho";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import AdminUI from "./pages/AdminUI";
import Dashboard from "./pages/admin/Dashboard";
import Categorias from "./pages/admin/Categorias";
import Produtos from "./pages/admin/Produtos";
import Adicionais from "./pages/admin/Adicionais";
import Pagamentos from "./pages/admin/Pagamentos";
import Pedidos from "./pages/admin/Pedidos";
import Cozinha from "./pages/admin/Cozinha";
import Configuracoes from "./pages/admin/Configuracoes";
import Mesas from "./pages/admin/Mesas";

import MesaCardapio from "./pages/MesaCardapio";
import FluxoStatus from "./pages/admin/FluxoStatus";
import TiposPedido from "./pages/admin/TiposPedido";
import Atendimento from "./pages/admin/Atendimento";
import FechamentoConta from "./pages/admin/FechamentoConta";
import CaixaDiario from "./pages/admin/CaixaDiario";
import Entregadores from "./pages/admin/Entregadores";
import GestaoEntregas from "./pages/admin/GestaoEntregas";
import AcertoEntregador from "./pages/admin/AcertoEntregador";
import NotFound from "./pages/NotFound";

import MinhasEmpresas from "./pages/MinhasEmpresas";
import LandingPage from "./pages/LandingPage";
import Clientes from "./pages/admin/Clientes";
import Fidelidade from "./pages/admin/Fidelidade";
import Cupons from "./pages/admin/Cupons";
import Ajuda from "./pages/admin/Ajuda";
import Lucratividade from "./pages/admin/Lucratividade";
import LucratividadeReal from "./pages/admin/LucratividadeReal";
import Vendas from "./pages/admin/Vendas";
import Usuarios from "./pages/admin/Usuarios";
import MinhaConta from "./pages/MinhaConta";
import IfoodConfig from "./pages/admin/Ifood";
import Cadastro from "./pages/Cadastro";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function GarcomRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/admin/${slug}/atendimento`} replace />;
}

function AdminRoute({ telaKey, children }: { telaKey: string; children: React.ReactNode }) {
  return <AdminGate telaKey={telaKey}>{children}</AdminGate>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <MesaProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <OrigemProvider>
              <Routes>
                {/* Public — scoped by empresa slug */}
                <Route path="/loja/:slug" element={<EmpresaProvider><Index /></EmpresaProvider>} />
                <Route path="/loja/:slug/carrinho" element={<EmpresaProvider><Carrinho /></EmpresaProvider>} />
                <Route path="/loja/:slug/checkout" element={<EmpresaProvider><Checkout /></EmpresaProvider>} />
                <Route path="/loja/:slug/mesa/:token" element={<EmpresaProvider><MesaCardapio /></EmpresaProvider>} />
                <Route path="/loja/:slug/minha-conta" element={<EmpresaProvider><MinhaConta /></EmpresaProvider>} />

                {/* Auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Cadastro />} />

                {/* Admin — scoped by empresa slug, access controlled by telaKey */}
                <Route path="/admin/:slug" element={<AdminRoute telaKey="dashboard"><Dashboard /></AdminRoute>} />
                <Route path="/admin/:slug/categorias" element={<AdminRoute telaKey="categorias"><Categorias /></AdminRoute>} />
                <Route path="/admin/:slug/produtos" element={<AdminRoute telaKey="produtos"><Produtos /></AdminRoute>} />
                <Route path="/admin/:slug/adicionais" element={<AdminRoute telaKey="adicionais"><Adicionais /></AdminRoute>} />
                <Route path="/admin/:slug/pagamentos" element={<AdminRoute telaKey="pagamentos"><Pagamentos /></AdminRoute>} />
                <Route path="/admin/:slug/pedidos" element={<AdminRoute telaKey="pedidos"><Pedidos /></AdminRoute>} />
                <Route path="/admin/:slug/cozinha" element={<AdminRoute telaKey="cozinha"><Cozinha /></AdminRoute>} />
                <Route path="/admin/:slug/mesas" element={<AdminRoute telaKey="mesas"><Mesas /></AdminRoute>} />
                <Route path="/admin/:slug/garcom" element={<GarcomRedirect />} />
                <Route path="/admin/:slug/ui" element={<AdminRoute telaKey="configuracoes"><AdminUI /></AdminRoute>} />
                <Route path="/admin/:slug/configuracoes" element={<AdminRoute telaKey="configuracoes"><Configuracoes /></AdminRoute>} />
                <Route path="/admin/:slug/fluxo-status" element={<AdminRoute telaKey="fluxo-status"><FluxoStatus /></AdminRoute>} />
                <Route path="/admin/:slug/tipos-pedido" element={<AdminRoute telaKey="tipos-pedido"><TiposPedido /></AdminRoute>} />
                <Route path="/admin/:slug/atendimento" element={<AdminRoute telaKey="atendimento"><Atendimento /></AdminRoute>} />
                <Route path="/admin/:slug/fechamento" element={<AdminRoute telaKey="fechamento"><FechamentoConta /></AdminRoute>} />
                <Route path="/admin/:slug/caixa" element={<AdminRoute telaKey="caixa"><CaixaDiario /></AdminRoute>} />
                <Route path="/admin/:slug/entregadores" element={<AdminRoute telaKey="entregadores"><Entregadores /></AdminRoute>} />
                <Route path="/admin/:slug/gestao-entregas" element={<AdminRoute telaKey="gestao-entregas"><GestaoEntregas /></AdminRoute>} />
                <Route path="/admin/:slug/acerto-entregador" element={<AdminRoute telaKey="acerto-entregador"><AcertoEntregador /></AdminRoute>} />
                <Route path="/admin/:slug/clientes" element={<AdminRoute telaKey="clientes"><Clientes /></AdminRoute>} />
                <Route path="/admin/:slug/fidelidade" element={<AdminRoute telaKey="fidelidade"><Fidelidade /></AdminRoute>} />
                <Route path="/admin/:slug/cupons" element={<AdminRoute telaKey="cupons"><Cupons /></AdminRoute>} />
                <Route path="/admin/:slug/margem-lucro" element={<AdminRoute telaKey="margem-lucro"><Lucratividade /></AdminRoute>} />
                <Route path="/admin/:slug/lucratividade" element={<AdminRoute telaKey="lucratividade"><LucratividadeReal /></AdminRoute>} />
                <Route path="/admin/:slug/vendas" element={<AdminRoute telaKey="vendas"><Vendas /></AdminRoute>} />
                <Route path="/admin/:slug/usuarios" element={<AdminRoute telaKey="usuarios"><Usuarios /></AdminRoute>} />
                <Route path="/admin/:slug/ajuda" element={<AdminRoute telaKey="ajuda"><Ajuda /></AdminRoute>} />
                <Route path="/admin/:slug/ifood" element={<AdminRoute telaKey="ifood"><IfoodConfig /></AdminRoute>} />

                {/* Legacy redirects */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/carrinho" element={<Navigate to="/loja/minha-empresa/carrinho" replace />} />
                <Route path="/checkout" element={<Navigate to="/loja/minha-empresa/checkout" replace />} />
                <Route path="/admin" element={<MinhasEmpresas />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </OrigemProvider>
          </BrowserRouter>
        </MesaProvider>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
