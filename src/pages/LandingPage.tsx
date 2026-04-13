import { Link } from "react-router-dom";
import {
  ShoppingBag, BarChart3, Users, CreditCard, ChefHat, Truck,
  QrCode, Bell, Shield, Zap, ArrowRight, Check, Menu, X,
  Smartphone, Monitor, ClipboardList, Star, TrendingUp, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import logoFluoDelivery from "@/assets/logo-fluodelivery.png";

const NAV_ITEMS = [
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Cardápio Digital", href: "#cardapio" },
  { label: "Gestão", href: "#gestao" },
  { label: "Vantagens", href: "#vantagens" },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-lg border-b">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <a href="#" className="flex items-center gap-2">
          <img src={logoFluoDelivery} alt="FluoDelivery" className="h-14" />
        </a>
        <div className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((i) => (
            <a key={i.href} href={i.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {i.label}
            </a>
          ))}
          <Link to="/login">
            <Button variant="outline" size="sm">Entrar</Button>
          </Link>
          <a href="#contato">
            <Button size="sm" className="bg-[hsl(var(--fluo-brand))] hover:bg-[hsl(var(--fluo-brand)/0.9)] text-white">Solicitar Demonstração</Button>
          </a>
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t bg-background px-4 pb-4 space-y-3">
          {NAV_ITEMS.map((i) => (
            <a key={i.href} href={i.href} className="block py-2 text-sm text-muted-foreground" onClick={() => setOpen(false)}>
              {i.label}
            </a>
          ))}
          <Link to="/login" className="block">
            <Button variant="outline" size="sm" className="w-full">Entrar</Button>
          </Link>
          <a href="#contato" className="block" onClick={() => setOpen(false)}>
            <Button size="sm" className="w-full bg-[hsl(var(--fluo-brand))] hover:bg-[hsl(var(--fluo-brand)/0.9)] text-white">Solicitar Demonstração</Button>
          </a>
        </div>
      )}
    </nav>
  );
}

function Hero() {
  return (
    <section className="pt-28 pb-20 md:pt-36 md:pb-28 bg-gradient-to-br from-primary/5 via-background to-primary/10 overflow-hidden">
      <div className="container mx-auto px-4 text-center max-w-4xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
          <Zap className="h-3.5 w-3.5" /> Sistema completo para delivery e food service
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight mb-6">
          Seu restaurante no <span className="text-primary">controle total</span>, do cardápio à entrega
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Cardápio digital, gestão de pedidos, cozinha, entregas, caixa e relatórios — tudo integrado em uma única plataforma intuitiva. Sem complicação, sem taxa por pedido. FluoDelivery é a solução completa para o seu negócio.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#contato">
            <Button size="lg" className="text-base px-8 gap-2 bg-[hsl(var(--fluo-brand))] hover:bg-[hsl(var(--fluo-brand)/0.9)] text-white">
              Solicitar Demonstração <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
          <a href="#funcionalidades">
            <Button variant="outline" size="lg" className="text-base px-8">
              Conhecer funcionalidades
            </Button>
          </a>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          {["Sem taxa por pedido", "Setup em minutos", "Suporte dedicado", "Multi-empresa"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-primary" /> {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: ShoppingBag, title: "Cardápio Digital", desc: "Link exclusivo para seu estabelecimento. Clientes pedem direto pelo celular, sem app." },
  { icon: QrCode, title: "QR Code por Mesa", desc: "Gere QR codes individuais para cada mesa. Pedidos vão direto para a cozinha." },
  { icon: ClipboardList, title: "Gestão de Pedidos", desc: "Kanban visual com status personalizáveis. Acompanhe cada pedido em tempo real." },
  { icon: ChefHat, title: "Painel da Cozinha", desc: "Tela dedicada para a equipe de produção visualizar e gerenciar os pedidos." },
  { icon: Truck, title: "Gestão de Entregas", desc: "Controle de entregadores, rotas, acerto de caixa e taxa de entrega configurável." },
  { icon: CreditCard, title: "Caixa & Pagamentos", desc: "Formas de pagamento personalizadas, controle de caixa diário e fechamento de contas." },
  { icon: Users, title: "Gestão de Clientes", desc: "Cadastro automático, histórico de pedidos, programa de fidelidade e cupons." },
  { icon: BarChart3, title: "Relatórios & Vendas", desc: "Dashboard com métricas, lucratividade, margem de lucro e relatório de vendas." },
  { icon: Shield, title: "Controle de Acesso", desc: "Perfis por função (atendente, garçom, cozinha, entregador) com permissões granulares." },
];

function Features() {
  return (
    <section id="funcionalidades" className="py-20 bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Funcionalidades pensadas para a operação real de restaurantes, lanchonetes, pizzarias e food trucks.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="group rounded-2xl border bg-card p-6 hover:shadow-lg hover:border-primary/30 transition-all">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CardapioSection() {
  return (
    <section id="cardapio" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
              <Smartphone className="h-3.5 w-3.5" /> Cardápio Digital
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Seu cardápio online, bonito e funcional
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Cada empresa recebe um link exclusivo com cardápio completo. Seus clientes navegam por categorias, escolhem adicionais, removem ingredientes e fazem o pedido — tudo pelo celular, sem precisar instalar nada.
            </p>
            <ul className="space-y-3">
              {[
                "Categorias organizadas com imagens dos produtos",
                "Adicionais e ingredientes removíveis por produto",
                "Carrinho intuitivo com observações por item",
                "Checkout com endereço, cupom e forma de pagamento",
                "QR Code individual por mesa para pedidos no local",
                "Funciona em qualquer celular, sem instalar app",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl p-8 md:p-12">
              <div className="bg-card rounded-2xl shadow-xl border p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">Meu Restaurante</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> 30-45 min</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {["Hambúrgueres", "Pizzas", "Bebidas"].map((cat) => (
                    <div key={cat} className="bg-muted/50 rounded-lg px-4 py-2.5 text-sm font-medium text-foreground">{cat}</div>
                  ))}
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">X-Burguer Especial</div>
                    <div className="text-xs text-muted-foreground">Blend 180g, queijo, alface...</div>
                  </div>
                  <span className="text-sm font-bold text-primary">R$ 28,90</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GestaoSection() {
  return (
    <section id="gestao" className="py-20 bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 relative">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-8 md:p-12">
              <div className="bg-card rounded-2xl shadow-xl border p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground text-sm">Dashboard</h3>
                  <span className="text-xs text-muted-foreground">Hoje</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Pedidos", value: "47", icon: ClipboardList },
                    { label: "Faturamento", value: "R$ 3.840", icon: TrendingUp },
                    { label: "Clientes", value: "32", icon: Users },
                  ].map((m) => (
                    <div key={m.label} className="bg-muted/50 rounded-lg p-3 text-center">
                      <m.icon className="h-4 w-4 text-primary mx-auto mb-1" />
                      <div className="text-lg font-bold text-foreground">{m.value}</div>
                      <div className="text-[10px] text-muted-foreground">{m.label}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {[
                    { status: "Novo", color: "bg-blue-100 text-blue-700", num: "#148" },
                    { status: "Preparo", color: "bg-yellow-100 text-yellow-700", num: "#147" },
                    { status: "Pronto", color: "bg-green-100 text-green-700", num: "#146" },
                  ].map((p) => (
                    <div key={p.num} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                      <span className="text-sm font-medium text-foreground">{p.num}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.color}`}>{p.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
              <Monitor className="h-3.5 w-3.5" /> Painel Administrativo
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Gerencie tudo de onde estiver
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Painel completo com controle total sobre pedidos, cozinha, entregas, caixa, equipe e relatórios. Cada membro da equipe acessa apenas o que precisa.
            </p>
            <ul className="space-y-3">
              {[
                "Dashboard com métricas em tempo real",
                "Kanban de pedidos com status personalizáveis",
                "Painel exclusivo para a cozinha",
                "Controle de caixa com abertura e fechamento",
                "Gestão de entregadores e acertos financeiros",
                "Relatórios de vendas, lucratividade e margem",
                "Perfis de acesso: admin, atendente, garçom, cozinha, entregador",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

const VANTAGENS = [
  { icon: Zap, title: "Zero taxa por pedido", desc: "Diferente de marketplaces, você não paga percentual sobre cada venda. Economia real no final do mês com FluoDelivery." },
  { icon: Clock, title: "Setup em minutos", desc: "Cadastre produtos, configure pagamentos e comece a receber pedidos no mesmo dia." },
  { icon: Star, title: "Fidelização automática", desc: "Regras de fidelidade geram cupons automaticamente para clientes recorrentes." },
  { icon: Bell, title: "Pedidos em tempo real", desc: "Receba pedidos instantaneamente no painel e na cozinha, sem delay." },
  { icon: Shield, title: "Multi-empresa", desc: "Gerencie múltiplas unidades ou marcas com um único login." },
  { icon: Smartphone, title: "100% responsivo", desc: "Funciona perfeitamente em celulares, tablets e computadores." },
];

function Vantagens() {
  return (
    <section id="vantagens" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Por que escolher o FluoDelivery?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Desenvolvido por quem entende a rotina de um restaurante. Simples, completo e sem surpresas. Esse é o FluoDelivery.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {VANTAGENS.map((v) => (
            <div key={v.title} className="flex gap-4 p-5 rounded-xl bg-card border hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <v.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="contato" className="py-20 bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Pronto para modernizar seu restaurante?
        </h2>
        <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
          Solicite uma demonstração gratuita e veja como o FluoDelivery pode transformar a operação do seu estabelecimento.
        </p>
        <div className="bg-card border rounded-2xl p-8 shadow-lg max-w-md mx-auto">
          <h3 className="font-semibold text-foreground mb-6">Solicitar Demonstração</h3>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const nome = (form.elements.namedItem("nome") as HTMLInputElement).value;
              const telefone = (form.elements.namedItem("telefone") as HTMLInputElement).value;
              const msg = encodeURIComponent(
                `Olá! Meu nome é ${nome} e gostaria de uma demonstração do FluoDelivery. Telefone: ${telefone}`
              );
              window.open(`https://wa.me/5500000000000?text=${msg}`, "_blank");
            }}
          >
            <input
              name="nome"
              type="text"
              required
              placeholder="Seu nome"
              className="w-full rounded-lg border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              name="telefone"
              type="tel"
              required
              placeholder="WhatsApp (ex: 11999999999)"
              className="w-full rounded-lg border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button type="submit" className="w-full text-base gap-2 bg-[hsl(var(--fluo-brand))] hover:bg-[hsl(var(--fluo-brand)/0.9)] text-white" size="lg">
              Enviar via WhatsApp <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-4">
            Respondemos em até 24 horas úteis.
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t py-8 bg-background">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <img src={logoFluoDelivery} alt="FluoDelivery" className="h-10" />
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} FluoDelivery. Todos os direitos reservados.
        </p>
        <Link to="/login" className="text-xs text-primary hover:underline">
          Acessar painel
        </Link>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Features />
      <CardapioSection />
      <GestaoSection />
      <Vantagens />
      <CTA />
      <Footer />
    </div>
  );
}
