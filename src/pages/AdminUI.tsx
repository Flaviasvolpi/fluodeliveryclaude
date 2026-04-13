import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  LayoutDashboard, Layers, Package, PlusCircle, CreditCard,
  ClipboardList, ChefHat, LogOut, Palette, Settings,
  Clock, CheckCircle2, Truck, Trash2, Printer,
  Plus, Pencil, ImageIcon, GripVertical, Search,
  ArrowUp, ArrowDown, ChevronDown, ChevronUp,
  Save, Upload, Sun, Moon,
  MessageCircle, MessageSquare, ShoppingCart, Store,
  Minus, ShoppingBag, X, Check, ChevronLeft, ChevronRight,
  Circle, MoreHorizontal, Dot, PanelLeft, ArrowLeft,
  ArrowRight, Inbox, AlertTriangle,
} from "lucide-react";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-4">
    <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
      {title}
    </h2>
    {children}
  </section>
);

const iconGroups = [
  {
    label: "Navegação / Sidebar",
    icons: [
      { name: "LayoutDashboard", Icon: LayoutDashboard },
      { name: "Layers", Icon: Layers },
      { name: "Package", Icon: Package },
      { name: "PlusCircle", Icon: PlusCircle },
      { name: "CreditCard", Icon: CreditCard },
      { name: "ClipboardList", Icon: ClipboardList },
      { name: "ChefHat", Icon: ChefHat },
      { name: "LogOut", Icon: LogOut },
      { name: "Palette", Icon: Palette },
      { name: "Settings", Icon: Settings },
    ],
  },
  {
    label: "Dashboard / Pedidos",
    icons: [
      { name: "Clock", Icon: Clock },
      { name: "CheckCircle2", Icon: CheckCircle2 },
      { name: "Truck", Icon: Truck },
      { name: "Trash2", Icon: Trash2 },
      { name: "Printer", Icon: Printer },
    ],
  },
  {
    label: "Produtos / CRUD",
    icons: [
      { name: "Plus", Icon: Plus },
      { name: "Pencil", Icon: Pencil },
      { name: "ImageIcon", Icon: ImageIcon },
      { name: "GripVertical", Icon: GripVertical },
      { name: "Search", Icon: Search },
      { name: "ArrowUp", Icon: ArrowUp },
      { name: "ArrowDown", Icon: ArrowDown },
      { name: "ChevronDown", Icon: ChevronDown },
      { name: "ChevronUp", Icon: ChevronUp },
      { name: "Save", Icon: Save },
      { name: "Upload", Icon: Upload },
    ],
  },
  {
    label: "Checkout / Carrinho",
    icons: [
      { name: "ShoppingCart", Icon: ShoppingCart },
      { name: "ShoppingBag", Icon: ShoppingBag },
      { name: "Minus", Icon: Minus },
      { name: "MessageCircle", Icon: MessageCircle },
      { name: "MessageSquare", Icon: MessageSquare },
    ],
  },
  {
    label: "Tema / Config",
    icons: [
      { name: "Sun", Icon: Sun },
      { name: "Moon", Icon: Moon },
      { name: "Store", Icon: Store },
    ],
  },
  {
    label: "UI Shared",
    icons: [
      { name: "X", Icon: X },
      { name: "Check", Icon: Check },
      { name: "ChevronLeft", Icon: ChevronLeft },
      { name: "ChevronRight", Icon: ChevronRight },
      { name: "Circle", Icon: Circle },
      { name: "MoreHorizontal", Icon: MoreHorizontal },
      { name: "Dot", Icon: Dot },
      { name: "PanelLeft", Icon: PanelLeft },
      { name: "ArrowLeft", Icon: ArrowLeft },
      { name: "ArrowRight", Icon: ArrowRight },
      { name: "Inbox", Icon: Inbox },
      { name: "AlertTriangle", Icon: AlertTriangle },
    ],
  },
];

const AdminUI = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">
            Design System — Cardápio Digital
          </h1>
          <p className="text-muted-foreground">
            Catálogo de componentes · Tema Claro (Light)
          </p>
        </div>

        {/* Color Palette */}
        <Section title="1. Paleta de Cores (Light Theme)">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: "Primary", var: "222.2 47.4% 11.2%", cls: "bg-primary" },
              { name: "Accent", var: "210 40% 96.1%", cls: "bg-accent" },
              { name: "Secondary", var: "210 40% 96.1%", cls: "bg-secondary" },
              { name: "Muted", var: "210 40% 96.1%", cls: "bg-muted" },
              { name: "Background", var: "0 0% 100%", cls: "bg-background border border-border" },
              { name: "Destructive", var: "0 84.2% 60.2%", cls: "bg-destructive" },
              { name: "Border", var: "214.3 31.8% 91.4%", cls: "bg-border" },
              { name: "Input", var: "214.3 31.8% 91.4%", cls: "bg-input" },
            ].map((c) => (
              <div key={c.name} className="space-y-1.5">
                <div className={`h-12 rounded-md ${c.cls}`} />
                <p className="text-xs font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{c.var}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: "Foreground", cls: "bg-foreground" },
              { name: "Card", cls: "bg-card border border-border" },
              { name: "Popover", cls: "bg-popover border border-border" },
              { name: "Ring", cls: "bg-ring" },
            ].map((c) => (
              <div key={c.name} className="space-y-1.5">
                <div className={`h-12 rounded-md ${c.cls}`} />
                <p className="text-xs font-medium text-foreground">{c.name}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section title="2. Tipografia">
          <div className="space-y-3">
            <p className="text-3xl font-bold">text-3xl · font-bold — Título principal</p>
            <p className="text-2xl font-bold">text-2xl · font-bold — Título de card</p>
            <p className="text-xl font-semibold">text-xl · font-semibold — Seção</p>
            <p className="text-lg font-semibold">text-lg · font-semibold — Subtítulo</p>
            <p className="text-base font-normal">text-base · font-normal — Corpo</p>
            <p className="text-sm text-muted-foreground">text-sm · text-muted-foreground — Label</p>
            <p className="text-xs text-muted-foreground">text-xs · text-muted-foreground — Caption</p>
          </div>
        </Section>

        {/* Icons */}
        <Section title="3. Ícones (Lucide React)">
          <div className="space-y-6">
            {iconGroups.map((group) => (
              <div key={group.label}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  {group.label}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {group.icons.map(({ name, Icon }) => (
                    <div
                      key={name}
                      className="flex flex-col items-center gap-1.5 w-20"
                    >
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                        <Icon className="h-5 w-5 text-foreground" />
                      </div>
                      <span className="text-[10px] text-muted-foreground text-center leading-tight truncate w-full">
                        {name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Buttons */}
        <Section title="4. Buttons">
          <div className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">🍕</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button disabled>Disabled</Button>
            <Button className="glow-button">Glow Effect</Button>
          </div>
        </Section>

        {/* Inputs */}
        <Section title="5. Inputs">
          <div className="grid gap-4 max-w-md">
            <div className="space-y-2">
              <Label>Text Input</Label>
              <Input placeholder="Digite algo..." />
            </div>
            <div className="space-y-2">
              <Label>Disabled</Label>
              <Input placeholder="Desabilitado" disabled />
            </div>
            <div className="space-y-2">
              <Label>Textarea</Label>
              <Textarea placeholder="Escreva uma descrição..." />
            </div>
            <div className="space-y-2">
              <Label>Select</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pizza">Pizza</SelectItem>
                  <SelectItem value="hamburguer">Hambúrguer</SelectItem>
                  <SelectItem value="sushi">Sushi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>

        {/* Toggles */}
        <Section title="6. Switch & Checkbox">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch id="switch-demo" />
              <Label htmlFor="switch-demo">Ativo</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="check-demo" />
              <Label htmlFor="check-demo">Concordo</Label>
            </div>
          </div>
        </Section>

        {/* Badges */}
        <Section title="7. Badges">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </Section>

        {/* Cards */}
        <Section title="8. Cards">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pizza Margherita</CardTitle>
                <CardDescription>
                  Molho de tomate, mozzarella e manjericão fresco.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">R$ 42,90</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Adicionar</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Hambúrguer Artesanal</CardTitle>
                <CardDescription>
                  Blend 180g, queijo cheddar, bacon crocante.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">R$ 38,50</p>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="outline">
                  Ver detalhes
                </Button>
              </CardFooter>
            </Card>
          </div>
        </Section>

        {/* Tabs */}
        <Section title="9. Tabs">
          <Tabs defaultValue="menu">
            <TabsList>
              <TabsTrigger value="menu">Cardápio</TabsTrigger>
              <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
              <TabsTrigger value="config">Configurações</TabsTrigger>
            </TabsList>
            <TabsContent value="menu">
              <p className="text-muted-foreground">Conteúdo da aba Cardápio.</p>
            </TabsContent>
            <TabsContent value="pedidos">
              <p className="text-muted-foreground">Conteúdo da aba Pedidos.</p>
            </TabsContent>
            <TabsContent value="config">
              <p className="text-muted-foreground">Conteúdo da aba Configurações.</p>
            </TabsContent>
          </Tabs>
        </Section>

        {/* Table */}
        <Section title="10. Table">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Pizza Calabresa</TableCell>
                  <TableCell>Pizzas</TableCell>
                  <TableCell className="text-right tabular-nums">R$ 39,90</TableCell>
                  <TableCell><Badge>Ativo</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Suco de Laranja</TableCell>
                  <TableCell>Bebidas</TableCell>
                  <TableCell className="text-right tabular-nums">R$ 12,00</TableCell>
                  <TableCell><Badge variant="secondary">Rascunho</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Petit Gateau</TableCell>
                  <TableCell>Sobremesas</TableCell>
                  <TableCell className="text-right tabular-nums">R$ 28,00</TableCell>
                  <TableCell><Badge variant="destructive">Esgotado</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </Section>

        {/* Dialog */}
        <Section title="11. Dialog / Modal">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Abrir Modal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar exclusão</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja remover este item do cardápio? Esta ação não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost">Cancelar</Button>
                <Button variant="destructive">Excluir</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Section>

        {/* States */}
        <Section title="12. Estados">
          <div className="grid gap-6 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Loading</CardTitle>
              </CardHeader>
              <CardContent>
                <LoadingSkeleton lines={4} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Empty</CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyState
                  title="Sem produtos"
                  description="Adicione itens ao cardápio."
                  className="py-8"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <ErrorState
                  title="Falha ao carregar"
                  description="Não foi possível buscar os dados."
                  onRetry={() => {}}
                  className="py-8"
                />
              </CardContent>
            </Card>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default AdminUI;
