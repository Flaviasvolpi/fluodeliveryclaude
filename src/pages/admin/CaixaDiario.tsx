import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useEmpresa } from "@/contexts/EmpresaContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatBRL, formatTime } from "@/lib/format";
import {
  Landmark, DoorOpen, DoorClosed, Banknote, CreditCard, TrendingUp,
  TrendingDown, Bike, CheckCircle2, Plus, Minus, Ticket,
} from "lucide-react";

export default function CaixaDiario() {
  const { empresaId } = useEmpresa();
  const queryClient = useQueryClient();
  const [valorAbertura, setValorAbertura] = useState(0);
  const [valorFechamento, setValorFechamento] = useState(0);
  const [observacoes, setObservacoes] = useState("");
  const [openAbrirDialog, setOpenAbrirDialog] = useState(false);
  
  const [filtroForma, setFiltroForma] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  // Sangria/Reforço
  const [sangriaDialog, setSangriaDialog] = useState<"sangria" | "reforco" | null>(null);
  const [sangriaValor, setSangriaValor] = useState(0);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayISO = useMemo(() => today.toISOString(), [today]);

  // Sessões do dia — backend retorna array ordenada por abertoEm desc
  const { data: sessoes, isLoading: loadingSessao } = useQuery({
    queryKey: ["caixa-sessoes", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/caixa/sessoes`);
      return data as any[];
    },
  });

  // Sessão mais recente de hoje (aberta ou fechada)
  const sessao = useMemo(() => {
    if (!sessoes?.length) return null;
    return sessoes.find((s) => {
      const abertoEm = s.aberto_em ? new Date(s.aberto_em) : null;
      return abertoEm && abertoEm >= today;
    }) ?? null;
  }, [sessoes, today]);

  const sessaoAberta = sessao?.status === "aberto";

  // Recebimentos da sessão
  const { data: recebimentos } = useQuery({
    queryKey: ["caixa-recebimentos", sessao?.id],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/caixa/recebimentos`, {
        params: { caixaSessaoId: sessao!.id },
      });
      return data as any[];
    },
    enabled: !!sessao?.id,
  });

  // Formas de pagamento
  const { data: formasPag } = useQuery({
    queryKey: ["formas-pag-caixa", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/formas-pagamento`);
      return data ?? [];
    },
  });

  // Acertos do dia com nome do entregador
  const { data: acertos } = useQuery({
    queryKey: ["motoboy-acertos", sessao?.id],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/caixa/acertos`, {
        params: { caixaSessaoId: sessao!.id },
      });
      return data;
    },
    enabled: !!sessao?.id,
  });

  // Entregadores para mapear nomes
  const { data: entregadoresList } = useQuery({
    queryKey: ["entregadores-nomes", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/entregadores`);
      return data;
    },
  });

  // Pedidos de entrega do dia (para motoboys) - busca de pedidos com forma_pagamento e tipo entrega
  const { data: pedidosEntrega } = useQuery({
    queryKey: ["pedidos-entrega-dia", empresaId, todayISO],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/pedidos`);
      return data as any[];
    },
  });

  // Descontos por cupom do dia
  const { data: descontoCupons } = useQuery({
    queryKey: ["cupons-desconto-dia", empresaId, todayISO],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/pedidos`);
      const count = data?.length ?? 0;
      const total = data?.reduce((s, p) => s + (p.desconto ?? 0), 0) ?? 0;
      return { count, total };
    },
  });

  // --- Mutations ---

  const abrirCaixa = useMutation({
    mutationFn: async () => {
      await api.post(`/empresas/${empresaId}/caixa/sessoes/abrir`, {
        valor_abertura: valorAbertura,
      });
    },
    onSuccess: () => {
      toast.success("Caixa aberto!");
      setOpenAbrirDialog(false);
      setValorAbertura(0);
      queryClient.invalidateQueries({ queryKey: ["caixa-sessoes"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const fecharCaixa = useMutation({
    mutationFn: async () => {
      if (!sessao) throw new Error("Nenhuma sessão aberta");
      await api.post(`/empresas/${empresaId}/caixa/sessoes/${sessao.id}/fechar`, {
        valor_fechamento: valorFechamento,
        observacoes,
      });
    },
    onSuccess: () => {
      toast.success("Caixa fechado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["caixa-sessoes"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const registrarSangria = useMutation({
    mutationFn: async (tipo: "sangria" | "reforco") => {
      if (!sessao) throw new Error("Caixa não está aberto");
      await api.post(`/empresas/${empresaId}/caixa/recebimentos`, {
        empresa_id: empresaId,
        caixa_sessao_id: sessao.id,
        valor: tipo === "sangria" ? -sangriaValor : sangriaValor,
        tipo_origem: tipo,
      });
    },
    onSuccess: (_, tipo) => {
      toast.success(tipo === "sangria" ? "Sangria registrada" : "Reforço registrado");
      setSangriaDialog(null);
      setSangriaValor(0);
      queryClient.invalidateQueries({ queryKey: ["caixa-recebimentos"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  

  // --- Computed ---

  const totaisPorForma = useMemo(() => {
    if (!recebimentos) return [];
    const map = new Map<string, { nome: string; total: number }>();
    for (const r of recebimentos) {
      if (r.tipo_origem === "sangria" || r.tipo_origem === "reforco") continue;
      const nome = (r.formas_pagamento as any)?.nome ?? "Sem forma";
      const cur = map.get(nome) ?? { nome, total: 0 };
      cur.total += r.valor;
      map.set(nome, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [recebimentos]);

  const totaisPorTipo = useMemo(() => {
    if (!recebimentos) return [];
    const map = new Map<string, { tipo: string; total: number; count: number }>();
    for (const r of recebimentos) {
      if (r.tipo_origem === "sangria" || r.tipo_origem === "reforco") continue;
      const tipo = (r.pedidos as any)?.tipo ?? r.tipo_origem;
      const cur = map.get(tipo) ?? { tipo, total: 0, count: 0 };
      cur.total += r.valor;
      cur.count += 1;
      map.set(tipo, cur);
    }
    return Array.from(map.values());
  }, [recebimentos]);

  const totalRecebido = useMemo(() => {
    if (!recebimentos) return 0;
    return recebimentos.reduce((s, r) => s + r.valor, 0);
  }, [recebimentos]);

  const totalSangrias = useMemo(() => {
    if (!recebimentos) return 0;
    return recebimentos.filter((r) => r.tipo_origem === "sangria").reduce((s, r) => s + r.valor, 0);
  }, [recebimentos]);

  const totalReforcos = useMemo(() => {
    if (!recebimentos) return 0;
    return recebimentos.filter((r) => r.tipo_origem === "reforco").reduce((s, r) => s + r.valor, 0);
  }, [recebimentos]);

  const totalEsperado = (sessao?.valor_abertura ?? 0) + totalRecebido;

  // Helper: nome do entregador por ID
  const getEntregadorNome = (id: string) => {
    return entregadoresList?.find((e) => e.id === id)?.nome ?? id.slice(0, 8) + "...";
  };

  const recebimentosFiltrados = useMemo(() => {
    if (!recebimentos) return [];
    return recebimentos.filter((r) => {
      if (filtroForma !== "todos" && (r.formas_pagamento as any)?.nome !== filtroForma) return false;
      if (filtroTipo !== "todos" && r.tipo_origem !== filtroTipo) return false;
      return true;
    });
  }, [recebimentos, filtroForma, filtroTipo]);

  const tipoLabels: Record<string, string> = {
    pedido: "Pedido",
    conta: "Conta",
    sangria: "Sangria",
    reforco: "Reforço",
  };

  if (loadingSessao) {
    return (
      <AdminLayout>
        <p className="text-center py-12 text-muted-foreground">Carregando...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Landmark className="h-6 w-6" /> Conferência de Caixa
            </h2>
            <p className="text-sm text-muted-foreground">
              {today.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {sessaoAberta ? (
              <>
                <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
                  <DoorOpen className="h-3.5 w-3.5" /> Caixa Aberto
                </Badge>
                <span className="text-xs text-muted-foreground">
                  desde {formatTime(sessao!.aberto_em)}
                </span>
              </>
            ) : sessao?.status === "fechado" ? (
              <Badge variant="secondary" className="gap-1">
                <DoorClosed className="h-3.5 w-3.5" /> Caixa Fechado
              </Badge>
            ) : (
              <Button onClick={() => setOpenAbrirDialog(true)}>
                <DoorOpen className="h-4 w-4 mr-2" /> Abrir Caixa
              </Button>
            )}
          </div>
        </div>

        {/* Abrir Caixa Dialog */}
        <Dialog open={openAbrirDialog} onOpenChange={setOpenAbrirDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Abrir Caixa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Fundo de Troco (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={valorAbertura || ""}
                  onChange={(e) => setValorAbertura(parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => abrirCaixa.mutate()} disabled={abrirCaixa.isPending}>
                {abrirCaixa.isPending ? "Abrindo..." : "Abrir Caixa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Sangria / Reforço Dialog */}
        <Dialog open={!!sangriaDialog} onOpenChange={() => setSangriaDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{sangriaDialog === "sangria" ? "Registrar Sangria" : "Registrar Reforço"}</DialogTitle>
            </DialogHeader>
            <div>
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={sangriaValor || ""}
                onChange={(e) => setSangriaValor(parseFloat(e.target.value) || 0)}
              />
            </div>
            <DialogFooter>
              <Button
                disabled={sangriaValor <= 0 || registrarSangria.isPending}
                onClick={() => sangriaDialog && registrarSangria.mutate(sangriaDialog)}
              >
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Main content - only if sessao exists */}
        {!sessao ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Landmark className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>Nenhum caixa aberto hoje.</p>
              <p className="text-xs mt-1">Clique em "Abrir Caixa" para iniciar o expediente.</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="resumo">
            <TabsList>
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="recebimentos">Recebimentos</TabsTrigger>
              <TabsTrigger value="entregadores">Entregadores</TabsTrigger>
              <TabsTrigger value="fechamento">Fechamento</TabsTrigger>
            </TabsList>

            {/* === RESUMO === */}
            <TabsContent value="resumo">
              <div className="space-y-6">
                {/* Cards de totais */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Fundo de Troco</p>
                      <p className="text-xl font-bold">{formatBRL(sessao.valor_abertura)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Total Recebido</p>
                      <p className="text-xl font-bold text-primary">{formatBRL(totalRecebido - totalSangrias - totalReforcos)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Sangrias</p>
                      <p className="text-xl font-bold text-destructive">{formatBRL(Math.abs(totalSangrias))}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Esperado em Caixa</p>
                      <p className="text-xl font-bold">{formatBRL(totalEsperado)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Ticket className="h-3 w-3" /> Descontos (cupons)
                      </p>
                      <p className="text-xl font-bold text-destructive">{formatBRL(descontoCupons?.total ?? 0)}</p>
                      <p className="text-xs text-muted-foreground">{descontoCupons?.count ?? 0} pedido(s)</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Por forma de pagamento */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4" /> Por Forma de Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {totaisPorForma.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum recebimento ainda.</p>
                    ) : (
                      <div className="space-y-2">
                        {totaisPorForma.map((f) => (
                          <div key={f.nome} className="flex justify-between items-center">
                            <span className="text-sm">{f.nome}</span>
                            <span className="font-semibold">{formatBRL(f.total)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Por tipo de pedido */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Banknote className="h-4 w-4" /> Por Tipo de Pedido
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {totaisPorTipo.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum recebimento ainda.</p>
                    ) : (
                      <div className="space-y-2">
                        {totaisPorTipo.map((t) => (
                          <div key={t.tipo} className="flex justify-between items-center">
                            <span className="text-sm capitalize">{t.tipo} ({t.count})</span>
                            <span className="font-semibold">{formatBRL(t.total)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Ações rápidas */}
                {sessaoAberta && (
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setSangriaDialog("sangria")}>
                      <Minus className="h-4 w-4 mr-1" /> Sangria
                    </Button>
                    <Button variant="outline" onClick={() => setSangriaDialog("reforco")}>
                      <Plus className="h-4 w-4 mr-1" /> Reforço
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* === RECEBIMENTOS === */}
            <TabsContent value="recebimentos">
              <div className="space-y-4">
                <div className="flex gap-3 flex-wrap">
                  <Select value={filtroForma} onValueChange={setFiltroForma}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Forma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas as formas</SelectItem>
                      {formasPag?.map((f) => (
                        <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os tipos</SelectItem>
                      <SelectItem value="pedido">Pedido</SelectItem>
                      <SelectItem value="conta">Conta</SelectItem>
                      <SelectItem value="sangria">Sangria</SelectItem>
                      <SelectItem value="reforco">Reforço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hora</TableHead>
                          <TableHead>Origem</TableHead>
                          <TableHead>Pedido</TableHead>
                          <TableHead>Forma</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!recebimentosFiltrados?.length ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              Nenhum recebimento encontrado.
                            </TableCell>
                          </TableRow>
                        ) : (
                          recebimentosFiltrados.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="text-sm">{formatTime(r.created_at)}</TableCell>
                              <TableCell>
                                <Badge variant={r.tipo_origem === "sangria" ? "destructive" : "secondary"} className="text-xs">
                                  {tipoLabels[r.tipo_origem] ?? r.tipo_origem}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {(r.pedidos as any)?.numero_sequencial
                                  ? `#${(r.pedidos as any).numero_sequencial} - ${(r.pedidos as any).cliente_nome}`
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-sm">{(r.formas_pagamento as any)?.nome ?? "—"}</TableCell>
                              <TableCell className={`text-right font-semibold ${r.valor < 0 ? "text-destructive" : ""}`}>
                                {formatBRL(r.valor)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* === ENTREGADORES === */}
            <TabsContent value="entregadores">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Entregadores que tiveram o caixa fechado e acertado hoje. Os acertos são feitos na tela "Acerto Entregador".
                </p>

                {!acertos || acertos.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <Bike className="h-12 w-12 mx-auto mb-3 opacity-40" />
                      <p>Nenhum acerto de entregador registrado hoje.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {acertos.map((a) => (
                      <Card key={a.id}>
                        <CardContent className="p-5 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-sm truncate">
                              <Bike className="inline h-4 w-4 mr-1" />
                              {getEntregadorNome(a.motoboy_user_id)}
                            </span>
                            <Badge className="bg-primary/20 text-primary gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Acertado
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total coletado:</span>
                              <span className="font-semibold">{formatBRL(a.total_coletado)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total devolvido:</span>
                              <span className="font-semibold">{formatBRL(a.total_devolvido)}</span>
                            </div>
                            {a.diferenca !== 0 && (
                              <div className={`flex justify-between ${a.diferenca < 0 ? "text-destructive" : "text-primary"}`}>
                                <span>Diferença:</span>
                                <span className="font-bold">{formatBRL(a.diferenca)}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* === FECHAMENTO === */}
            <TabsContent value="fechamento">
              <div className="max-w-lg mx-auto space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Conferência de Caixa</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Fundo de troco:</span>
                      <span>{formatBRL(sessao.valor_abertura)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Recebimentos (vendas):</span>
                      <span className="text-primary font-medium">{formatBRL(totalRecebido - totalSangrias - totalReforcos)}</span>
                    </div>
                    {totalSangrias !== 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Sangrias:</span>
                        <span className="text-destructive">{formatBRL(totalSangrias)}</span>
                      </div>
                    )}
                    {totalReforcos !== 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Reforços:</span>
                        <span>{formatBRL(totalReforcos)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total esperado em caixa:</span>
                      <span>{formatBRL(totalEsperado)}</span>
                    </div>
                    <Separator />

                    {sessaoAberta ? (
                      <>
                        <div>
                          <Label>Valor contado em caixa (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            value={valorFechamento || ""}
                            onChange={(e) => setValorFechamento(parseFloat(e.target.value) || 0)}
                            className="text-lg"
                          />
                        </div>
                        {valorFechamento > 0 && (
                          <div className={`flex justify-between text-sm font-bold ${valorFechamento - totalEsperado < 0 ? "text-destructive" : "text-primary"}`}>
                            <span>Diferença:</span>
                            <span className="flex items-center gap-1">
                              {valorFechamento - totalEsperado < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                              {formatBRL(valorFechamento - totalEsperado)}
                            </span>
                          </div>
                        )}
                        <div>
                          <Label>Observações</Label>
                          <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} placeholder="Anotações sobre o fechamento..." />
                        </div>
                        <Button className="w-full" size="lg" onClick={() => fecharCaixa.mutate()} disabled={fecharCaixa.isPending || valorFechamento <= 0}>
                          <DoorClosed className="h-4 w-4 mr-2" />
                          {fecharCaixa.isPending ? "Fechando..." : "Fechar Caixa"}
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Caixa fechado
                        </Badge>
                        {sessao.valor_fechamento != null && (
                          <div className="mt-3 space-y-1 text-sm">
                            <p>Valor contado: <strong>{formatBRL(sessao.valor_fechamento)}</strong></p>
                            <p className={sessao.valor_fechamento - totalEsperado < 0 ? "text-destructive" : "text-primary"}>
                              Diferença: <strong>{formatBRL(sessao.valor_fechamento - totalEsperado)}</strong>
                            </p>
                          </div>
                        )}
                        {sessao.observacoes && (
                          <p className="mt-2 text-xs text-muted-foreground">{sessao.observacoes}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
}
