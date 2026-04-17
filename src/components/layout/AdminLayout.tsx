import { NavLink } from "@/components/NavLink";
import ThemeToggle from "@/components/ThemeToggle";
import { useLocation } from "react-router-dom";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useAuth } from "@/hooks/useAuth";
import { useUserTelas } from "@/hooks/usePerfilPermissoes";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Layers, Package, PlusCircle, CreditCard, ClipboardList, ChefHat,
  LogOut, Settings, QrCode, GitBranch, Headset, Tags, Receipt, Landmark, Truck, Wallet,
  Users, Gift, Ticket, ShoppingBag, DollarSign, HelpCircle, TrendingUp, MapPin,
} from "lucide-react";
import { SidebarFooter } from "@/components/ui/sidebar";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
  telaKey: string;
}

interface MenuGroup {
  label: string;
  icon: React.ElementType;
  items: MenuItem[];
}

function AdminSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, user } = useAuth();
  const { slug, empresa } = useEmpresa();
  const { isAdmin, telas } = useUserTelas(user?.id);

  const canAccess = (telaKey: string) => isAdmin || telas.includes(telaKey);

  const dashboardItem: MenuItem = { title: "Dashboard", url: `/admin/${slug}`, icon: LayoutDashboard, telaKey: "dashboard" };

  const menuGroups: MenuGroup[] = [
    {
      label: "Vendas",
      icon: ShoppingBag,
      items: [
        { title: "Atendimento", url: `/admin/${slug}/atendimento`, icon: Headset, telaKey: "atendimento" },
        { title: "Pedidos", url: `/admin/${slug}/pedidos`, icon: ClipboardList, telaKey: "pedidos" },
        { title: "Cozinha", url: `/admin/${slug}/cozinha`, icon: ChefHat, telaKey: "cozinha" },
      ],
    },
    {
      label: "Entregas",
      icon: Truck,
      items: [
        { title: "Gestão Entregas", url: `/admin/${slug}/gestao-entregas`, icon: Truck, telaKey: "gestao-entregas" },
        { title: "Acerto Entregador", url: `/admin/${slug}/acerto-entregador`, icon: Wallet, telaKey: "acerto-entregador" },
      ],
    },
    {
      label: "Financeiro",
      icon: DollarSign,
      items: [
        { title: "Vendas", url: `/admin/${slug}/vendas`, icon: ShoppingBag, telaKey: "vendas" },
        { title: "Caixa", url: `/admin/${slug}/caixa`, icon: Landmark, telaKey: "caixa" },
        { title: "Fechar Conta", url: `/admin/${slug}/fechamento`, icon: Receipt, telaKey: "fechamento" },
        { title: "Pagamentos", url: `/admin/${slug}/pagamentos`, icon: CreditCard, telaKey: "pagamentos" },
        { title: "Taxas de Entrega", url: `/admin/${slug}/taxas-entrega`, icon: MapPin, telaKey: "taxas-entrega" },
        { title: "Margem de Lucro", url: `/admin/${slug}/margem-lucro`, icon: TrendingUp, telaKey: "margem-lucro" },
        { title: "Lucratividade", url: `/admin/${slug}/lucratividade`, icon: DollarSign, telaKey: "lucratividade" },
      ],
    },
    {
      label: "Clientes",
      icon: Users,
      items: [
        { title: "Clientes", url: `/admin/${slug}/clientes`, icon: Users, telaKey: "clientes" },
        { title: "Fidelidade", url: `/admin/${slug}/fidelidade`, icon: Gift, telaKey: "fidelidade" },
        { title: "Cupons", url: `/admin/${slug}/cupons`, icon: Ticket, telaKey: "cupons" },
      ],
    },
    {
      label: "Catálogo",
      icon: Package,
      items: [
        { title: "Categorias", url: `/admin/${slug}/categorias`, icon: Layers, telaKey: "categorias" },
        { title: "Produtos", url: `/admin/${slug}/produtos`, icon: Package, telaKey: "produtos" },
        { title: "Adicionais", url: `/admin/${slug}/adicionais`, icon: PlusCircle, telaKey: "adicionais" },
      ],
    },
  ];

  const configItems: MenuItem[] = [
    { title: "Mesas", url: `/admin/${slug}/mesas`, icon: QrCode, telaKey: "mesas" },
    { title: "Entregadores", url: `/admin/${slug}/entregadores`, icon: Truck, telaKey: "entregadores" },
    { title: "Usuários", url: `/admin/${slug}/usuarios`, icon: Users, telaKey: "usuarios" },
    { title: "Tipos de Pedido", url: `/admin/${slug}/tipos-pedido`, icon: Tags, telaKey: "tipos-pedido" },
    { title: "Fluxo de Status", url: `/admin/${slug}/fluxo-status`, icon: GitBranch, telaKey: "fluxo-status" },
    { title: "Configurações", url: `/admin/${slug}/configuracoes`, icon: Settings, telaKey: "configuracoes" },
    { title: "iFood", url: `/admin/${slug}/ifood`, icon: ExternalLink, telaKey: "ifood" },
  ];

  const renderItem = (item: MenuItem) => (
    <SidebarMenuItem key={item.url}>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          end={item.url === `/admin/${slug}`}
          className="rounded-xl px-3 py-2.5 transition-all text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          activeClassName="bg-sidebar-accent text-primary font-medium border border-primary/50 shadow-[0_0_12px_hsl(187_85%_53%/0.15)]"
        >
          <item.icon className="mr-2.5 h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  const renderGroup = (group: MenuGroup) => {
    const visibleItems = group.items.filter((i) => canAccess(i.telaKey));
    if (visibleItems.length === 0) return null;

    const isActive = visibleItems.some((i) => location.pathname === i.url);
    return (
      <Collapsible key={group.label} defaultOpen={isActive}>
        <SidebarGroup className="py-0">
          <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider hover:text-sidebar-foreground/90 transition-colors">
            <group.icon className="h-3.5 w-3.5" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
              </>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1 px-1">
                {visibleItems.map(renderItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  };

  const visibleConfigItems = configItems.filter((i) => canAccess(i.telaKey));

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            {empresa.nome}
            <a
              href={`${window.location.origin}/loja/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-normal normal-case tracking-normal"
              title="Abrir cardápio público"
            >
              <ExternalLink className="h-3 w-3" />
              {!collapsed && "Cardápio"}
            </a>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5 px-1">
              {canAccess("dashboard") && renderItem(dashboardItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {menuGroups.map(renderGroup)}
      </SidebarContent>

      <SidebarFooter>
        {visibleConfigItems.length > 0 && (
          <Collapsible defaultOpen={visibleConfigItems.some(i => location.pathname === i.url)}>
            <SidebarGroup className="py-0">
              <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider hover:text-sidebar-foreground/90 transition-colors">
                <Settings className="h-3.5 w-3.5" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Configurações</span>
                    <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                  </>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1 px-1">
                    {visibleConfigItems.map(renderItem)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}
        <div className="p-3 border-t space-y-1">
          <SidebarMenu>
            {canAccess("ajuda") && renderItem({ title: "Ajuda", url: `/admin/${slug}/ajuda`, icon: HelpCircle, telaKey: "ajuda" })}
          </SidebarMenu>
          {!collapsed && (
            <p className="text-xs text-muted-foreground truncate mt-2 mb-1">{user?.email}</p>
          )}
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            {!collapsed && "Sair"}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-x-hidden">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-12 flex items-center border-b px-4 min-w-0">
            <SidebarTrigger className="mr-4" />
            <h1 className="text-sm font-semibold text-muted-foreground flex-1 truncate">Painel Administrativo</h1>
            <ThemeToggle />
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden overflow-y-auto min-w-0">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
