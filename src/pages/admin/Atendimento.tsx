import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";


import { useEmpresa } from "@/contexts/EmpresaContext";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import AdminLayout from "@/components/layout/AdminLayout";
import ProductCard from "@/components/ProductCard";
import ProductDialog from "@/components/ProductDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatBRL } from "@/lib/format";
import { calcItemSubtotal, calcCartTotal } from "@/types/cart";
import { ArrowLeft, CheckCircle2, Minus, Plus, Search, ShoppingCart, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Produto, ProdutoVariante } from "@/types/database";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useTiposConfig, getInternoTipos, type TipoConfig } from "@/hooks/useTiposConfig";
import { Link } from "react-router-dom";

export default function Atendimento() {
  const { empresaId, slug } = useEmpresa();
  const { user } = useAuth();
  const { items, removeItem, updateQty, clearCart, itemCount } = useCart();
  const qc = useQueryClient();
  const { data: tiposConfig } = useTiposConfig(empresaId);

  const internoTipos = tiposConfig ? getInternoTipos(tiposConfig) : [];

  const [selectedTipo, setSelectedTipo] = useState<TipoConfig | null>(null);
  const [selectedMesaId, setSelectedMesaId] = useState<string | null>(null);
  const [referencia, setReferencia] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [obs, setObs] = useState("");
  const [pedidoNumero, setPedidoNumero] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [endereco, setEndereco] = useState({ rua: "", numero: "", bairro: "", complemento: "", referencia: "" });
  const [taxaEntregaValue, setTaxaEntregaValue] = useState("0");
  const [showConfirmacao, setShowConfirmacao] = useState(false);
  const [forceTypeSelect, setForceTypeSelect] = useState(false);
  const [showCriarMesa, setShowCriarMesa] = useState(false);
  const [novaMesaNumero, setNovaMesaNumero] = useState("");
  const [novaMesaNome, setNovaMesaNome] = useState("");
  const isScrollingRef = useRef(false);
  const catBarRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Auto-select only when there's exactly one interno type (and not forced to show selector)
  useEffect(() => {
    if (!selectedTipo && !forceTypeSelect && internoTipos.length === 1) {
      setSelectedTipo(internoTipos[0]);
    }
  }, [internoTipos, selectedTipo, forceTypeSelect]);

  const { data: mesas } = useQuery({
    queryKey: ["atendimento-mesas", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/mesas`);
      return data;
    },
    enabled: !!selectedTipo?.exige_mesa,
  });

  const criarMesa = useMutation({
    mutationFn: async () => {
      const numero = parseInt(novaMesaNumero);
      if (!numero || !novaMesaNome.trim()) throw new Error("Preencha número e nome da mesa");
      const token = crypto.randomUUID();
      await api.post(`/empresas/${empresaId}/mesas`, {
        empresa_id: empresaId, numero, nome: novaMesaNome.trim(), qr_code_token: token,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atendimento-mesas", empresaId] });
      setShowCriarMesa(false);
      setNovaMesaNumero("");
      setNovaMesaNome("");
      toast.success("Mesa criada!");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao criar mesa."),
  });

  const { data: categorias } = useQuery({
    queryKey: ["categorias-active", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/categorias/active`);
      return data;
    },
  });

  const { data: produtos, isLoading } = useQuery({
    queryKey: ["atendimento-produtos-active", empresaId, search],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const { data } = await api.get(`/empresas/${empresaId}/produtos/active`, { params });
      return data;
    },
  });


  const { data: taxaPadrao } = useQuery({
    queryKey: ["config-taxa-entrega", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/configuracoes`);
      return data?.valor ?? "0";
    },
    enabled: !!selectedTipo?.exige_endereco,
  });

  // Auto-generate reference number
  const { data: nextRef } = useQuery({
    queryKey: ["next-referencia", empresaId, selectedTipo?.tipo_key],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/pedidos`);
      const last = data?.[0]?.referencia;
      const num = last ? parseInt(last, 10) : 0;
      return String((isNaN(num) ? 0 : num) + 1);
    },
    enabled: !!selectedTipo?.exige_referencia && !!selectedTipo?.referencia_auto,
  });

  useEffect(() => {
    if (selectedTipo?.referencia_auto && nextRef) setReferencia(nextRef);
  }, [nextRef, selectedTipo?.referencia_auto]);

  useEffect(() => {
    if (taxaPadrao && selectedTipo?.exige_endereco) setTaxaEntregaValue(taxaPadrao);
  }, [taxaPadrao, selectedTipo?.exige_endereco]);

  const selectedMesa = mesas?.find((m) => m.id === selectedMesaId);

  const sections = useMemo(() => {
    if (!categorias || !produtos) return [];
    const groups: { id: string; nome: string; items: typeof produtos }[] = [];
    for (const cat of categorias) {
      const catItems = produtos.filter((p) => p.categoria_id === cat.id);
      if (catItems.length > 0) groups.push({ id: cat.id, nome: cat.nome, items: catItems });
    }
    const uncategorized = produtos.filter((p) => !p.categoria_id);
    if (uncategorized.length > 0) groups.push({ id: "__outros", nome: "Outros", items: uncategorized });
    return groups;
  }, [categorias, produtos]);

  useEffect(() => {
    if (search || !sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-cat-id");
            if (id) setActiveCat(id);
          }
        }
      },
      { rootMargin: "-10% 0px -60% 0px", threshold: 0 }
    );
    const refs = sectionRefs.current;
    for (const id of Object.keys(refs)) { const el = refs[id]; if (el) observer.observe(el); }
    return () => observer.disconnect();
  }, [sections, search]);

  const scrollToSection = useCallback((catId: string) => {
    const el = sectionRefs.current[catId];
    if (!el) return;
    isScrollingRef.current = true;
    setActiveCat(catId);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => { isScrollingRef.current = false; }, 800);
  }, []);

  const subtotal = calcCartTotal(items);
  const taxaEntrega = selectedTipo?.exige_endereco ? (parseFloat(taxaEntregaValue) || 0) : 0;

  const { data: taxaServicoPerc } = useQuery({
    queryKey: ["config-taxa-servico", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/configuracoes`);
      const conf = data?.find((c: any) => c.chave === "taxa_servico_percentual");
      return parseFloat(conf?.valor ?? "0") || 0;
    },
    staleTime: 60 * 1000,
  });

  const aplicaTaxaServico = !!selectedTipo?.cobra_taxa_servico && (taxaServicoPerc ?? 0) > 0;
  const taxaServico = aplicaTaxaServico
    ? Math.round((subtotal * (taxaServicoPerc ?? 0)) / 100 * 100) / 100
    : 0;
  const total = subtotal + taxaEntrega + taxaServico;

  const createPedido = useMutation({
    mutationFn: async () => {
      if (!selectedTipo) throw new Error("Selecione um tipo");
      if (selectedTipo.exige_mesa && !selectedMesaId) throw new Error("Selecione uma mesa");
      if (selectedTipo.exige_referencia && !referencia) throw new Error("Preencha a referência");

      const payload = {
        empresa_id: empresaId,
        cliente_nome: clienteNome || (selectedMesa?.nome ?? `${selectedTipo.label}`),
        tipo: selectedTipo.tipo_key,
        mesa_id: selectedTipo.exige_mesa ? selectedMesaId : null,
        garcom_user_id: user?.id || null,
        referencia: selectedTipo.exige_referencia ? referencia : null,
        endereco: selectedTipo.exige_endereco ? endereco : null,
        subtotal,
        taxa_entrega: taxaEntrega,
        taxa_servico: taxaServico,
        total,
        forma_pagamento_id: null,
        pagar_na_entrega: selectedTipo.exige_endereco ? true : false,
        observacoes: obs || null,
        itens: items.map((item) => ({
          produto_id: item.produto_id,
          produto_variante_id: item.variante_id ?? null,
          nome_snapshot: item.produto_nome,
          variante_nome_snapshot: item.variante_nome ?? null,
          preco_unit_snapshot: item.preco_unit,
          custo_unit_snapshot: item.custo_unit,
          qtd: item.qtd,
          observacao_item: item.observacao ?? null,
          adicionais: item.adicionais.map((a) => ({
            adicional_item_id: a.adicional_item_id,
            nome_snapshot: a.nome,
            preco_snapshot: a.preco,
            qtd: a.qtd,
          })),
        })),
      };
      const { data } = await api.post(`/empresas/${empresaId}/pedidos`, payload);
      const numero = Number(data?.numero_pedido ?? data?.numeroPedido ?? data);
      return isNaN(numero) ? 0 : numero;
    },
    onSuccess: (numero) => {
      setPedidoNumero(numero);
      clearCart();
      setClienteNome("");
      setObs("");
      setShowConfirmacao(false);
      setSheetOpen(false);
    },
    onError: (err: any) => toast.error(err.message || "Erro ao criar pedido"),
  });

  // Success screen
  if (pedidoNumero !== null) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <CheckCircle2 className="h-16 w-16 text-primary" />
          <h2 className="text-2xl font-bold">Pedido #{pedidoNumero}</h2>
          <p className="text-muted-foreground">
            {selectedTipo?.label}
            {selectedTipo?.exige_mesa && selectedMesa && ` — ${selectedMesa.nome}`}
            {selectedTipo?.exige_referencia && referencia && ` — ${selectedTipo.referencia_label || "Ref"} #${referencia}`}
          </p>
          <div className="flex gap-2">
            <Button onClick={() => { setPedidoNumero(null); setReferencia(""); }}>Novo Pedido</Button>
            <Button variant="outline" onClick={() => { setPedidoNumero(null); setSelectedTipo(null); setSelectedMesaId(null); setReferencia(""); setForceTypeSelect(true); clearCart(); }}>Trocar Tipo</Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Step 1: select type (if multiple interno types)
  if (!selectedTipo) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Atendimento — Novo Pedido</h2>
          <p className="text-muted-foreground">Selecione o tipo de pedido:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {internoTipos.map((tipo) => (
              <Card key={tipo.tipo_key} className="cursor-pointer hover:border-primary/50 transition-all active:scale-[0.97]" onClick={() => { setSelectedTipo(tipo); setForceTypeSelect(false); clearCart(); }}>
                <CardContent className="p-6 text-center">
                  <span className="text-lg font-bold">{tipo.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
          {internoTipos.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhum tipo interno configurado. Configure em Tipos de Pedido.</p>
          )}
        </div>
      </AdminLayout>
    );
  }

  function openCriarMesa() {
    const nextNum = mesas?.length ? Math.max(...mesas.map((m) => m.numero)) + 1 : 1;
    setNovaMesaNumero(String(nextNum));
    setNovaMesaNome(`Mesa ${nextNum}`);
    setShowCriarMesa(true);
  }

  // Step 2: select mesa (if required)
  if (selectedTipo.exige_mesa && !selectedMesaId) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => { setSelectedTipo(null); setForceTypeSelect(true); }}>← Trocar tipo</Button>
            <Badge variant="secondary" className="text-base px-3 py-1">{selectedTipo.label}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Selecionar Mesa</h2>
            <Button size="sm" onClick={openCriarMesa} className="gap-2">
              <Plus className="h-4 w-4" /> Nova Mesa
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {mesas?.map((mesa) => (
              <Card key={mesa.id} className="cursor-pointer hover:border-primary/50 transition-all active:scale-[0.97]" onClick={() => { setSelectedMesaId(mesa.id); clearCart(); }}>
                <CardContent className="p-6 text-center">
                  <span className="text-2xl font-bold">{mesa.numero}</span>
                  <p className="text-sm text-muted-foreground mt-1">{mesa.nome}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {(!mesas || mesas.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma mesa cadastrada. Clique em "Nova Mesa" para começar.
            </div>
          )}
        </div>

        <Dialog open={showCriarMesa} onOpenChange={(o) => { if (!o) setShowCriarMesa(false); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Mesa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Número *</Label>
                <Input type="number" min="1" value={novaMesaNumero} onChange={(e) => setNovaMesaNumero(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Nome *</Label>
                <Input value={novaMesaNome} onChange={(e) => setNovaMesaNome(e.target.value)} placeholder="Ex: Mesa 5" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCriarMesa(false)}>Cancelar</Button>
              <Button onClick={() => criarMesa.mutate()} disabled={criarMesa.isPending}>
                {criarMesa.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    );
  }

  const isSearching = search.length > 0;
  const headerLabel = selectedTipo.exige_mesa && selectedMesa
    ? `${selectedTipo.label} — ${selectedMesa.nome}`
    : selectedTipo.exige_referencia && referencia
    ? `${selectedTipo.label} #${referencia}`
    : selectedTipo.label;

  // Step 3: Menu + order
  return (
    <AdminLayout>
      <div className="space-y-0 w-full max-w-[100vw]">
        <div className="flex items-center justify-between gap-2 mb-4 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => { setSelectedTipo(null); setSelectedMesaId(null); setReferencia(""); setForceTypeSelect(true); clearCart(); }}>←</Button>
            <Badge variant="secondary" className="text-sm px-2 py-1 truncate">{headerLabel}</Badge>
          </div>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="default" size="sm" className="gap-1.5 relative shrink-0">
                <ShoppingCart className="h-4 w-4" />
                <span>Pedido</span>
                {itemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">{itemCount}</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col">
              <SheetHeader><SheetTitle>Pedido — {headerLabel}</SheetTitle></SheetHeader>

              {showConfirmacao ? (
                /* ===== TELA DE CONFIRMAÇÃO ===== */
                <div className="flex-1 overflow-y-auto space-y-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm">{selectedTipo.label}</Badge>
                    {selectedTipo.exige_mesa && selectedMesa && (
                      <Badge variant="outline" className="text-sm">Mesa {selectedMesa.numero} — {selectedMesa.nome}</Badge>
                    )}
                    {selectedTipo.exige_referencia && referencia && (
                      <Badge variant="outline" className="text-sm">{selectedTipo.referencia_label || "Ref"} #{referencia}</Badge>
                    )}
                  </div>

                  {clienteNome && (
                    <div className="text-sm"><span className="text-muted-foreground">Cliente:</span> {clienteNome}</div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Itens do pedido</h3>
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm py-2 border-b last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{item.qtd}× {item.produto_nome}{item.variante_nome && ` (${item.variante_nome})`}</div>
                          {item.adicionais.length > 0 && (
                            <div className="text-xs text-muted-foreground">+ {item.adicionais.map((a) => `${a.nome}${a.qtd > 1 ? ` ×${a.qtd}` : ""}`).join(", ")}</div>
                          )}
                          {item.observacao && <div className="text-xs text-muted-foreground/70 italic">{item.observacao}</div>}
                        </div>
                        <span className="text-muted-foreground whitespace-nowrap ml-2">{formatBRL(calcItemSubtotal(item))}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>Subtotal</span><span>{formatBRL(subtotal)}</span></div>
                    {taxaEntrega > 0 && (
                      <div className="flex justify-between"><span>Taxa de entrega</span><span>{formatBRL(taxaEntrega)}</span></div>
                    )}
                    {taxaServico > 0 && (
                      <div className="flex justify-between"><span>Taxa de serviço ({taxaServicoPerc}%)</span><span>{formatBRL(taxaServico)}</span></div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-1">
                      <span>Total</span><span className="text-primary">{formatBRL(total)}</span>
                    </div>
                  </div>

                  {obs && (
                    <>
                      <Separator />
                      <div className="text-sm"><span className="text-muted-foreground">Obs:</span> {obs}</div>
                    </>
                  )}
                </div>
              ) : (
                /* ===== TELA DE EDIÇÃO (original) ===== */
                <div className="flex-1 overflow-y-auto space-y-3 mt-4">
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Adicione itens ao pedido</p>
                  ) : (
                    items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm p-2 rounded-lg border">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => updateQty(item.id, Math.max(1, item.qtd - 1))}><Minus className="h-3 w-3" /></Button>
                          <span className="w-5 text-center">{item.qtd}</span>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => updateQty(item.id, item.qtd + 1)}><Plus className="h-3 w-3" /></Button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="truncate block">{item.produto_nome}{item.variante_nome && ` (${item.variante_nome})`}</span>
                          {item.adicionais.length > 0 && <span className="text-xs text-muted-foreground block truncate">+ {item.adicionais.map((a) => a.nome).join(", ")}</span>}
                          {item.observacao && <span className="text-xs text-muted-foreground/70 block italic truncate">{item.observacao}</span>}
                        </div>
                        <span className="text-muted-foreground whitespace-nowrap">{formatBRL(calcItemSubtotal(item))}</span>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => removeItem(item.id)}><X className="h-3 w-3" /></Button>
                      </div>
                    ))
                  )}
                  {items.length > 0 && (
                    <>
                      <div className="border-t pt-2 flex justify-between font-bold text-lg">
                        <span>Total</span><span className="text-primary">{formatBRL(total)}</span>
                      </div>
                      <div className="space-y-3 border-t pt-3">
                        <div className="space-y-1">
                          <Label>Nome do cliente (opcional)</Label>
                          <Input value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} placeholder={selectedMesa?.nome ?? selectedTipo.label} />
                        </div>
                        {selectedTipo.exige_referencia && (
                          <div className="space-y-1">
                            <Label>{selectedTipo.referencia_label || "Referência"}</Label>
                            <Input value={referencia} onChange={(e) => setReferencia(e.target.value)} readOnly={selectedTipo.referencia_auto} placeholder={selectedTipo.referencia_auto ? "Auto" : "Digite..."} />
                          </div>
                        )}
                        {selectedTipo.exige_endereco && (
                          <div className="space-y-2">
                            <Label className="font-medium">Endereço</Label>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="col-span-2"><Input placeholder="Rua" value={endereco.rua} onChange={(e) => setEndereco({ ...endereco, rua: e.target.value })} /></div>
                              <Input placeholder="Nº" value={endereco.numero} onChange={(e) => setEndereco({ ...endereco, numero: e.target.value })} />
                            </div>
                            <Input placeholder="Bairro" value={endereco.bairro} onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })} />
                            <Input placeholder="Complemento" value={endereco.complemento} onChange={(e) => setEndereco({ ...endereco, complemento: e.target.value })} />
                            <div className="space-y-1">
                              <Label className="text-xs">Taxa entrega (R$)</Label>
                              <Input type="number" min="0" step="0.01" value={taxaEntregaValue} onChange={(e) => setTaxaEntregaValue(e.target.value)} />
                            </div>
                          </div>
                        )}
                        <div className="space-y-1">
                          <Label>Observações</Label>
                          <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {items.length > 0 && (
                <div className="border-t pt-3 mt-auto space-y-2">
                  {showConfirmacao ? (
                    <>
                      <Button className="w-full" size="lg" onClick={() => createPedido.mutate()} disabled={createPedido.isPending}>
                        {createPedido.isPending ? "Enviando..." : `Confirmar e Enviar · ${formatBRL(total)}`}
                      </Button>
                      <Button className="w-full" size="lg" variant="outline" onClick={() => setShowConfirmacao(false)}>
                        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar e Editar
                      </Button>
                    </>
                  ) : (
                    <Button className="w-full" size="lg" onClick={() => setShowConfirmacao(true)}>
                      Revisar Pedido · {formatBRL(total)}
                    </Button>
                  )}
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>

        {/* FAB mobile para abrir pedido */}
        {selectedTipo && !sheetOpen && (
          <button
            className="fixed bottom-6 right-6 z-40 sm:hidden flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-4 py-3 shadow-lg active:scale-95 transition-transform"
            onClick={() => setSheetOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="font-semibold text-sm">
              {itemCount > 0 ? `Pedido (${itemCount})` : "Pedido"}
            </span>
          </button>
        )}

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar produtos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        {!isSearching && categorias && categorias.length > 0 && (
          <div ref={catBarRef} className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border pt-3 shadow-sm">
            <Button variant={activeCat === null ? "default" : "outline"} size="default" onClick={() => { setActiveCat(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="text-base font-semibold whitespace-nowrap">Todos</Button>
            {sections.map((s) => (
              <Button key={s.id} data-cat-btn={s.id} variant={activeCat === s.id ? "default" : "outline"} size="default" onClick={() => scrollToSection(s.id)} className="whitespace-nowrap text-base font-semibold">{s.nome}</Button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 min-w-0 w-full max-w-full overflow-hidden">
            {[1, 2, 3].map((i) => (<Card key={i} className="p-4"><LoadingSkeleton lines={4} /></Card>))}
          </div>
        ) : isSearching ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 min-w-0 w-full max-w-full overflow-hidden">
              {produtos?.map((p) => <ProductCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} />)}
            </div>
            {produtos?.length === 0 && <div className="text-center py-12 text-muted-foreground">Nenhum produto encontrado.</div>}
          </>
        ) : (
          <div className="space-y-8">
            {sections.map((section) => (
              <div key={section.id} ref={(el) => { sectionRefs.current[section.id] = el; }} data-cat-id={section.id} className="scroll-mt-28">
                <h2 className="text-2xl font-bold text-foreground mb-4">{section.nome}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 min-w-0 w-full max-w-full overflow-hidden">
                  {section.items.map((p) => <ProductCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} />)}
                </div>
              </div>
            ))}
            {sections.length === 0 && !isLoading && <div className="text-center py-12 text-muted-foreground">Nenhum produto encontrado.</div>}
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductDialog
          produto={selectedProduct as Produto & { produto_variantes?: ProdutoVariante[] }}
          open={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </AdminLayout>
  );
}
