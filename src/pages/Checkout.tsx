import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Ticket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useMesa } from "@/contexts/MesaContext";
import PublicLayout from "@/components/layout/PublicLayout";
import { useCart } from "@/contexts/CartContext";
import { useOrigem } from "@/contexts/OrigemContext";
import { useClienteSession } from "@/hooks/useClienteSession";
import ClienteLoginModal from "@/components/cliente/ClienteLoginModal";
import EnderecoSelectorCheckout from "@/components/cliente/EnderecoSelectorCheckout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatBRL } from "@/lib/format";
import { calcItemSubtotal, calcCartTotal } from "@/types/cart";
import type { PedidoTipo } from "@/types/database";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, MessageCircle, MessageSquare, UtensilsCrossed, UserCircle, LogIn } from "lucide-react";
import BotaoVoltarAtendimento from "@/components/BotaoVoltarAtendimento";
import { useTiposConfig, getOnlineTipos } from "@/hooks/useTiposConfig";

const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cliente-auth`;

export default function Checkout() {
  const { items, clearCart } = useCart();
  const navigate = useNavigate();
  const { empresaId, slug } = useEmpresa();
  const { mesaId, mesaNumero, mesaNome } = useMesa();
  const { origem, phone, voltarAtendimento } = useOrigem();
  const { session: clienteSession, login: clienteLogin } = useClienteSession();
  const isMesa = !!mesaId;
  const { data: tiposConfig } = useTiposConfig(empresaId);
  const onlineTipos = tiposConfig ? getOnlineTipos(tiposConfig) : [];
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipo, setTipo] = useState<PedidoTipo>(isMesa ? "mesa" : "retirada");
  const [endereco, setEndereco] = useState({ rua: "", numero: "", bairro: "", complemento: "", referencia: "" });
  const [formaPagId, setFormaPagId] = useState<string | null>(null);
  const [trocoParaValue, setTrocoParaValue] = useState("");
  const [taxaEntregaValue, setTaxaEntregaValue] = useState("");
  const [taxaPadraoLoaded, setTaxaPadraoLoaded] = useState(false);
  const [obs, setObs] = useState("");
  const [pagarNaEntrega, setPagarNaEntrega] = useState(true);
  const [pedidoNumero, setPedidoNumero] = useState<number | null>(null);
  const [cupomCodigo, setCupomCodigo] = useState("");
  const [cupomValidado, setCupomValidado] = useState<{ tipo_desconto: string; valor_desconto: number; codigo: string } | null>(null);
  const [cupomErro, setCupomErro] = useState("");
  const [clienteStatus, setClienteStatus] = useState<null | "tem_conta" | "sem_conta">(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<"login" | "cadastro">("login");
  const [autoFilled, setAutoFilled] = useState(false);
  const [cuponsDisponiveis, setCuponsDisponiveis] = useState<Array<{ id: string; codigo: string; tipo_desconto: string; valor_desconto: number; valor_minimo: number }>>([]);

  // Fetch available coupons for logged-in client
  useEffect(() => {
    if (!clienteSession) { setCuponsDisponiveis([]); return; }
    // Check config first
    api.get(`/empresas/${empresaId}/configuracoes`)
      .then(({ data }) => {
        const configData = data.find((c: any) => c.chave === "mostrar_cupons_checkout");
        if (configData?.valor === "false") { setCuponsDisponiveis([]); return; }
        fetch(`${BASE_URL}/meus-cupons`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cliente_id: clienteSession.cliente_id, empresa_id: empresaId }),
        })
          .then((r) => r.json())
          .then((data) => setCuponsDisponiveis(data.cupons || []))
          .catch(() => setCuponsDisponiveis([]));
      });
  }, [clienteSession, empresaId]);

  // Auto-fill when already logged in
  useEffect(() => {
    if (clienteSession && !autoFilled) {
      setNome(clienteSession.nome);
      setTelefone(clienteSession.telefone || "");
      setAutoFilled(true);
      // Fetch default address
      fetch(`${BASE_URL}/meus-enderecos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteSession.cliente_id, empresa_id: empresaId, action: "listar" }),
      })
        .then((r) => r.json())
        .then((data) => {
          const padrao = (data.enderecos || []).find((e: any) => e.padrao) || data.enderecos?.[0];
          if (padrao) {
            setEndereco({
              rua: padrao.rua || "",
              numero: padrao.numero || "",
              bairro: padrao.bairro || "",
              complemento: padrao.complemento || "",
              referencia: padrao.referencia || "",
            });
          }
        })
        .catch(() => {});
    }
  }, [clienteSession, autoFilled, empresaId]);

  const checkTelefone = useCallback(async (tel: string) => {
    if (!tel || tel.length < 8 || clienteSession) return;
    try {
      const res = await fetch(`${BASE_URL}/verificar-telefone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresa_id: empresaId, telefone: tel }),
      });
      const data = await res.json();
      if (data.existe && data.tem_conta) {
        setClienteStatus("tem_conta");
      } else if (data.existe) {
        setClienteStatus("sem_conta");
      } else {
        setClienteStatus(null);
      }
    } catch {
      setClienteStatus(null);
    }
  }, [empresaId, clienteSession]);

  const handleLoginSuccess = (data: { cliente_id: string; nome: string; telefone: string; empresa_id: string }) => {
    clienteLogin(data);
    setNome(data.nome);
    setTelefone(data.telefone || "");
    setClienteStatus(null);
    setShowLoginModal(false);
    // Fetch default address
    fetch(`${BASE_URL}/meus-enderecos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente_id: data.cliente_id, empresa_id: empresaId, action: "listar" }),
    })
      .then((r) => r.json())
      .then((res) => {
        const padrao = (res.enderecos || []).find((e: any) => e.padrao) || res.enderecos?.[0];
        if (padrao) {
          setEndereco({
            rua: padrao.rua || "",
            numero: padrao.numero || "",
            bairro: padrao.bairro || "",
            complemento: padrao.complemento || "",
            referencia: padrao.referencia || "",
          });
        }
      })
      .catch(() => {});
  };

  const { data: taxaPadrao } = useQuery({
    queryKey: ["config-taxa-entrega", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/configuracoes`);
      const taxa = data.find((c: any) => c.chave === "taxa_entrega_padrao");
      return taxa?.valor ?? "0";
    },
  });

  const selectedTipoConfig = onlineTipos.find((t) => t.tipo_key === tipo) ?? tiposConfig?.find((t) => t.tipo_key === tipo);
  const tipoExigeEndereco = selectedTipoConfig?.exige_endereco ?? false;

  if (tipoExigeEndereco && taxaPadrao && !taxaPadraoLoaded) {
    setTaxaEntregaValue(taxaPadrao);
    setTaxaPadraoLoaded(true);
  }
  if (!tipoExigeEndereco && taxaPadraoLoaded) {
    setTaxaPadraoLoaded(false);
  }

  const { data: formasPag } = useQuery({
    queryKey: ["formas-pagamento", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/formas-pagamento`);
      return data ?? [];
    },
  });

  const selectedForma = formasPag?.find((f: any) => f.id === formaPagId);
  const subtotal = calcCartTotal(items);
  const taxaEntrega = tipoExigeEndereco ? (parseFloat(taxaEntregaValue) || 0) : 0;
  const desconto = cupomValidado
    ? cupomValidado.tipo_desconto === "percentual"
      ? Math.min(Math.round(subtotal * cupomValidado.valor_desconto) / 100, subtotal)
      : Math.min(cupomValidado.valor_desconto, subtotal)
    : 0;
  const total = subtotal - desconto + taxaEntrega;

  const validarCupom = async () => {
    setCupomErro("");
    setCupomValidado(null);
    if (!cupomCodigo.trim()) return;
    try {
      const { data } = await api.get(`/empresas/${empresaId}/cupons`, {
        params: { codigo: cupomCodigo.trim().toUpperCase() },
      });
      const cupom = Array.isArray(data) ? data.find((c: any) => c.codigo === cupomCodigo.trim().toUpperCase() && c.ativo) : data;
      if (!cupom) { setCupomErro("Cupom não encontrado"); return; }
      if (cupom.uso_atual >= cupom.uso_maximo) { setCupomErro("Cupom esgotado"); return; }
      if (cupom.valido_ate && new Date(cupom.valido_ate) < new Date()) { setCupomErro("Cupom expirado"); return; }
      if (cupom.valor_minimo > 0 && subtotal < cupom.valor_minimo) { setCupomErro(`Valor mínimo: R$ ${cupom.valor_minimo.toFixed(2)}`); return; }
      setCupomValidado({ tipo_desconto: cupom.tipo_desconto, valor_desconto: cupom.valor_desconto, codigo: cupom.codigo });
    } catch {
      setCupomErro("Cupom não encontrado");
    }
  };

  const buildPayload = () => ({
    empresa_id: empresaId,
    cliente_nome: nome,
    cliente_telefone: telefone || null,
    tipo,
    endereco: tipoExigeEndereco ? endereco : null,
    subtotal,
    taxa_entrega: taxaEntrega,
    total,
    cupom_codigo: cupomValidado?.codigo || null,
    forma_pagamento_id: formaPagId || null,
    pagar_na_entrega: pagarNaEntrega,
    observacoes: obs || null,
    mesa_id: isMesa ? mesaId : null,
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
  });

  const createPedido = useMutation({
    mutationFn: async () => {
      const payload = buildPayload();
      const { data } = await api.post(`/empresas/${empresaId}/pedidos`, payload);
      return data as number;
    },
    onSuccess: (numero) => {
      setPedidoNumero(numero);
      clearCart();
    },
  });

  if (pedidoNumero !== null) {
    const isWhatsapp = origem === "whatsapp";

    const handleAcompanhar = () => {
      if (!phone) return;
      const msg = encodeURIComponent(`Quero acompanhar meu pedido #${pedidoNumero}`);
      window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${msg}`, "_blank");
    };

    return (
      <PublicLayout>
        <div className="container px-4 py-16 text-center space-y-4 max-w-lg mx-auto">
          <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
          <h2 className="text-2xl font-bold">Pedido #{pedidoNumero}</h2>
          <p className="text-muted-foreground">Seu pedido foi recebido com sucesso!</p>

          {phone && (
            <Button onClick={handleAcompanhar} className="w-full gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white" size="lg">
              <MessageCircle className="h-5 w-5" />
              Quero acompanhar meu pedido
            </Button>
          )}

          {origem && (
            <Card className={`border-2 ${isWhatsapp ? "border-[#25D366]/40 bg-[#25D366]/5" : "border-primary/40 bg-primary/5"}`}>
              <CardContent className="py-5 space-y-3">
                <p className="text-sm font-medium">Pedido realizado! Volte ao atendimento para continuar a conversa.</p>
                <Button onClick={voltarAtendimento} className={`gap-2 ${isWhatsapp ? "bg-[#25D366] hover:bg-[#1ebe5a] text-white" : ""}`}>
                  {isWhatsapp ? <MessageCircle className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                  {isWhatsapp ? "Voltar ao WhatsApp" : "Voltar ao atendimento"}
                </Button>
              </CardContent>
            </Card>
          )}

          {!clienteSession && (
            <Card className="border border-primary/30 bg-primary/5">
              <CardContent className="py-5 space-y-3">
                <UserCircle className="mx-auto h-8 w-8 text-primary" />
                <p className="text-sm font-medium">Crie sua conta para acompanhar pedidos e ganhar cupons!</p>
                <Button variant="outline" size="sm" onClick={() => { setLoginModalMode("cadastro"); setShowLoginModal(true); }}>
                  Criar minha conta
                </Button>
              </CardContent>
            </Card>
          )}

          {clienteSession && (
            <Button variant="outline" onClick={() => navigate(`/loja/${slug}/minha-conta`)}>
              Ver meus pedidos
            </Button>
          )}

          <Button variant="outline" onClick={() => navigate(`/loja/${slug}`)}>Voltar ao cardápio</Button>
          <ClienteLoginModal
            open={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onSuccess={handleLoginSuccess}
            initialMode={loginModalMode}
            initialTelefone={telefone}
          />
        </div>
      </PublicLayout>
    );
  }

  if (items.length === 0) {
    navigate(`/loja/${slug}/carrinho`);
    return null;
  }

  const isFormValid = nome && (!(formasPag && formasPag.length > 0) || formaPagId) && (!tipoExigeEndereco || (endereco.rua && endereco.numero && endereco.bairro));

  const tipoCard = isMesa ? (
    <Card>
      <CardHeader><CardTitle className="text-base">Tipo de pedido</CardTitle></CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">{mesaNome}</p>
            <p className="text-sm text-muted-foreground">Pedido para mesa</p>
          </div>
        </div>
      </CardContent>
    </Card>
  ) : null;

  const summaryCard = (
    <Card>
      <CardHeader><CardTitle className="text-base">Resumo</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>{item.qtd}x {item.produto_nome}{item.variante_nome && ` (${item.variante_nome})`}</span>
            <span>{formatBRL(calcItemSubtotal(item))}</span>
          </div>
        ))}
        <div className="border-t pt-2 space-y-1">
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatBRL(subtotal)}</span></div>
          {desconto > 0 && <div className="flex justify-between text-sm text-green-600"><span>Desconto (cupom)</span><span>-{formatBRL(desconto)}</span></div>}
          {taxaEntrega > 0 && <div className="flex justify-between text-sm"><span>Taxa de entrega</span><span>{formatBRL(taxaEntrega)}</span></div>}
          <div className="flex justify-between font-bold"><span>Total</span><span className="text-primary">{formatBRL(total)}</span></div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <PublicLayout>
      <BotaoVoltarAtendimento />
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Finalizar Pedido</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Seus dados</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1"><Label>Nome *</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" required /></div>
                <div className="space-y-1">
                  <Label>Telefone</Label>
                  <Input
                    value={telefone}
                    onChange={(e) => { setTelefone(e.target.value); setClienteStatus(null); }}
                    onBlur={(e) => checkTelefone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                {clienteStatus === "tem_conta" && !clienteSession && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                    <UserCircle className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Você já tem conta!</p>
                      <p className="text-xs text-muted-foreground">Faça login para preencher seus dados automaticamente</p>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1 shrink-0" onClick={() => { setLoginModalMode("login"); setShowLoginModal(true); }}>
                      <LogIn className="h-3.5 w-3.5" /> Entrar
                    </Button>
                  </div>
                )}
                {clienteStatus === "sem_conta" && !clienteSession && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-muted bg-muted/30">
                    <UserCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground">Crie uma conta para acompanhar pedidos e ganhar cupons!</p>
                    <Button size="sm" variant="ghost" className="shrink-0 text-xs" onClick={() => { setLoginModalMode("cadastro"); setShowLoginModal(true); }}>Criar conta</Button>
                  </div>
                )}
                {clienteSession && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <p className="text-sm text-primary font-medium">Logado como {clienteSession.nome}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <ClienteLoginModal
              open={showLoginModal}
              onClose={() => setShowLoginModal(false)}
              onSuccess={handleLoginSuccess}
              initialMode={loginModalMode}
              initialTelefone={telefone}
            />
            {tipoCard || (
              <Card>
                <CardHeader><CardTitle className="text-base">Tipo de pedido</CardTitle></CardHeader>
                <CardContent>
                  <RadioGroup value={tipo} onValueChange={(v) => setTipo(v as PedidoTipo)}>
                    {onlineTipos.map((t) => (
                      <div key={t.tipo_key} className="flex items-center gap-2 p-3 rounded-lg border mb-2">
                        <RadioGroupItem value={t.tipo_key} id={t.tipo_key} />
                        <Label htmlFor={t.tipo_key}>{t.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {tipoExigeEndereco && (
                    <div className="space-y-3 mt-4">
                      {clienteSession && (
                        <EnderecoSelectorCheckout
                          clienteId={clienteSession.cliente_id}
                          empresaId={empresaId}
                          endereco={endereco}
                          onEnderecoChange={setEndereco}
                        />
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-2 space-y-1"><Label>Rua *</Label><Input value={endereco.rua} onChange={(e) => setEndereco({ ...endereco, rua: e.target.value })} /></div>
                        <div className="space-y-1"><Label>Nº *</Label><Input value={endereco.numero} onChange={(e) => setEndereco({ ...endereco, numero: e.target.value })} /></div>
                      </div>
                      <div className="space-y-1"><Label>Bairro *</Label><Input value={endereco.bairro} onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })} /></div>
                      <div className="space-y-1"><Label>Complemento</Label><Input value={endereco.complemento} onChange={(e) => setEndereco({ ...endereco, complemento: e.target.value })} /></div>
                      <div className="space-y-1"><Label>Referência</Label><Input value={endereco.referencia} onChange={(e) => setEndereco({ ...endereco, referencia: e.target.value })} /></div>
                      <div className="space-y-1"><Label>Taxa de entrega (R$)</Label><Input type="number" min="0" step="0.01" placeholder="0,00" value={taxaEntregaValue} readOnly disabled className="bg-muted" /></div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {tipoExigeEndereco && (
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <Label className="font-medium">Pagar na entrega</Label>
                  <p className="text-xs text-muted-foreground">O pagamento será feito ao entregador</p>
                </div>
                <Switch checked={pagarNaEntrega} onCheckedChange={setPagarNaEntrega} disabled />
              </div>
            )}
            <Card>
              <CardHeader><CardTitle className="text-base">Pagamento</CardTitle></CardHeader>
              <CardContent>
                <RadioGroup value={formaPagId ?? ""} onValueChange={setFormaPagId}>
                  {formasPag?.map((f: any) => (
                    <div key={f.id} className="flex items-center gap-2 p-3 rounded-lg border mb-2"><RadioGroupItem value={f.id} id={f.id} /><Label htmlFor={f.id}>{f.nome}</Label></div>
                  ))}
                </RadioGroup>
                {selectedForma?.exige_troco && (
                  <div className="mt-3 space-y-1"><Label>Troco para</Label><Input type="number" placeholder="Ex: 50.00" value={trocoParaValue} onChange={(e) => setTrocoParaValue(e.target.value)} /></div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Cupom de desconto</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {cuponsDisponiveis.length > 0 && !cupomValidado && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Você tem {cuponsDisponiveis.length} cupom(ns) disponível(is)!</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cuponsDisponiveis.map((c) => (
                        <Badge
                          key={c.id}
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors font-mono text-xs px-3 py-1"
                          onClick={() => {
                            setCupomCodigo(c.codigo);
                            setCupomErro("");
                            setCupomValidado(null);
                            // Auto-validate
                            setTimeout(() => {
                              const cupom = cuponsDisponiveis.find((x) => x.codigo === c.codigo);
                              if (cupom) {
                                if (cupom.valor_minimo > 0 && subtotal < cupom.valor_minimo) {
                                  setCupomErro(`Valor mínimo: R$ ${cupom.valor_minimo.toFixed(2)}`);
                                } else {
                                  setCupomValidado({ tipo_desconto: cupom.tipo_desconto, valor_desconto: cupom.valor_desconto, codigo: cupom.codigo });
                                }
                              }
                            }, 0);
                          }}
                        >
                          {c.codigo}
                          <span className="ml-1 opacity-70">
                            ({c.tipo_desconto === "percentual" ? `${c.valor_desconto}%` : `R$${c.valor_desconto.toFixed(2)}`})
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={cupomCodigo}
                    onChange={(e) => { setCupomCodigo(e.target.value.toUpperCase()); setCupomErro(""); setCupomValidado(null); }}
                    placeholder="Digite o código"
                    className="font-mono"
                  />
                  <Button type="button" variant="outline" onClick={validarCupom} disabled={!cupomCodigo.trim()}>Aplicar</Button>
                </div>
                {cupomErro && <p className="text-sm text-destructive mt-2">{cupomErro}</p>}
                {cupomValidado && (
                  <p className="text-sm text-green-600 mt-2">
                    Cupom aplicado: {cupomValidado.tipo_desconto === "percentual" ? `${cupomValidado.valor_desconto}% de desconto` : `R$ ${cupomValidado.valor_desconto.toFixed(2)} de desconto`}
                  </p>
                )}
              </CardContent>
            </Card>
            <div className="space-y-1"><Label>Observações gerais</Label><Textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Alguma observação sobre o pedido?" rows={2} /></div>
            <div className="md:hidden space-y-4">
              {summaryCard}
              <Button className="w-full" size="lg" onClick={() => createPedido.mutate()} disabled={!isFormValid || createPedido.isPending}>
                {createPedido.isPending ? "Enviando..." : `Confirmar Pedido · ${formatBRL(total)}`}
              </Button>
              {createPedido.isError && <p className="text-sm text-destructive text-center">Erro ao criar pedido. Tente novamente.</p>}
            </div>
          </div>
          <div className="hidden md:block">
            <div className="sticky top-20 space-y-4">
              {summaryCard}
              <Button className="w-full" size="lg" onClick={() => createPedido.mutate()} disabled={!isFormValid || createPedido.isPending}>
                {createPedido.isPending ? "Enviando..." : `Confirmar Pedido · ${formatBRL(total)}`}
              </Button>
              {createPedido.isError && <p className="text-sm text-destructive text-center">Erro ao criar pedido. Tente novamente.</p>}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
