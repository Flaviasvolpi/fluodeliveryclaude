import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useEmpresa } from "@/contexts/EmpresaContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatBRL, formatTime } from "@/lib/format";
import { toast } from "sonner";
import { Wallet, Plus, Lock, Trash2 } from "lucide-react";

type PagamentoLinha = { forma_pagamento_id: string; valor: string };

export default function AcertoEntregador() {
  const { empresaId } = useEmpresa();
  const qc = useQueryClient();
  const [entregadorId, setEntregadorId] = useState<string>("");
  const [suprimentoDialog, setSuprimentoDialog] = useState(false);
  const [suprimentoValor, setSuprimentoValor] = useState("");
  const [recebDialog, setRecebDialog] = useState(false);
  const [selectedPedidos, setSelectedPedidos] = useState<Set<string>>(new Set());
  const [pagamentos, setPagamentos] = useState<PagamentoLinha[]>([{ forma_pagamento_id: "", valor: "" }]);

  const { data: entregadores } = useQuery({
    queryKey: ["entregadores-ativos", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/entregadores`);
      return data;
    },
  });

  const { data: caixaAberto } = useQuery({
    queryKey: ["entregador-caixa-aberto", empresaId, entregadorId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/caixa/entregador-caixa`);
      return data;
    },
    enabled: !!entregadorId,
  });

  const { data: pedidosEntregador } = useQuery({
    queryKey: ["pedidos-entregador", empresaId, entregadorId, caixaAberto?.id],
    queryFn: async () => {
      if (!caixaAberto) return [];
      const { data } = await api.get(`/empresas/${empresaId}/pedidos`);
      return data;
    },
    enabled: !!entregadorId && !!caixaAberto,
  });

  const { data: recebimentos } = useQuery({
    queryKey: ["entregador-recebimentos", caixaAberto?.id],
    queryFn: async () => {
      if (!caixaAberto) return [];
      const { data } = await api.get(`/empresas/${empresaId}/caixa/entregador-recebimentos`);
      return data;
    },
    enabled: !!caixaAberto,
  });

  const { data: formasPag } = useQuery({
    queryKey: ["formas-pagamento-ativas", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/formas-pagamento`);
      return data;
    },
  });

  const abrirCaixa = useMutation({
    mutationFn: async () => {
      const valor = parseFloat(suprimentoValor) || 0;
      await api.post(`/empresas/${empresaId}/caixa/entregador-caixa`, {
        empresa_id: empresaId,
        entregador_id: entregadorId,
        suprimento: valor,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entregador-caixa-aberto"] });
      setSuprimentoDialog(false);
      setSuprimentoValor("");
      toast.success("Caixa do entregador aberto!");
    },
  });

  const lancarRecebimento = useMutation({
    mutationFn: async () => {
      const linhasValidas = pagamentos.filter((l) => parseFloat(l.valor) > 0 && l.forma_pagamento_id);
      if (linhasValidas.length === 0) throw new Error("Adicione ao menos um pagamento válido");

      // Insert all payment lines
      const inserts = linhasValidas.map((l) => ({
        empresa_id: empresaId,
        entregador_caixa_id: caixaAberto!.id,
        forma_pagamento_id: l.forma_pagamento_id,
        valor: parseFloat(l.valor),
      }));
      await api.post(`/empresas/${empresaId}/caixa/entregador-recebimentos`, inserts);
      // Mark selected pedidos as "entregue"
      const ids = Array.from(selectedPedidos);
      for (const id of ids) {
        await api.patch(`/empresas/${empresaId}/pedidos/${id}/status`, { pedido_status: "entregue" });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entregador-recebimentos"] });
      qc.invalidateQueries({ queryKey: ["pedidos-entregador"] });
      qc.invalidateQueries({ queryKey: ["admin-pedidos"] });
      setRecebDialog(false);
      setSelectedPedidos(new Set());
      setPagamentos([{ forma_pagamento_id: "", valor: "" }]);
      toast.success("Recebimento lançado e entregas finalizadas!");
    },
  });

  const fecharCaixa = useMutation({
    mutationFn: async () => {
      // 1. Fechar o caixa do entregador
      await api.patch(`/empresas/${empresaId}/caixa/entregador-caixa/${caixaAberto!.id}`, {
        status: "fechado",
        fechado_em: new Date().toISOString(),
      });
      // 2. Buscar sessão de caixa principal aberta
      const { data: sessaoPrincipal } = await api.get(`/empresas/${empresaId}/caixa/sessoes`);

      const caixaSessaoId = sessaoPrincipal?.id ?? null;

      // 3. Calcular total coletado
      const totalColetado = (recebimentos ?? []).reduce((sum: number, r: any) => sum + Number(r.valor), 0);

      // 4. Inserir motoboy_acertos (resumo)
      await api.post(`/empresas/${empresaId}/caixa/acertos`, {
        empresa_id: empresaId,
        caixa_sessao_id: caixaSessaoId,
        motoboy_user_id: entregadorId,
        total_coletado: totalColetado,
        total_devolvido: totalColetado,
        diferenca: 0,
      });
      // 5. Inserir caixa_recebimentos para cada recebimento do entregador (vincula ao caixa principal)
      if (caixaSessaoId && recebimentos && recebimentos.length > 0) {
        const caixaInserts = recebimentos.map((r: any) => ({
          empresa_id: empresaId,
          caixa_sessao_id: caixaSessaoId,
          pedido_id: r.pedido_id ?? null,
          forma_pagamento_id: r.forma_pagamento_id ?? null,
          valor: Number(r.valor),
          tipo_origem: "motoboy",
          motoboy_user_id: entregadorId,
        }));
        await api.post(`/empresas/${empresaId}/caixa/recebimentos`, caixaInserts);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entregador-caixa-aberto"] });
      qc.invalidateQueries({ queryKey: ["caixa-recebimentos"] });
      qc.invalidateQueries({ queryKey: ["motoboy-acertos"] });
      qc.invalidateQueries({ queryKey: ["caixa-sessao"] });
      toast.success("Caixa do entregador fechado e valores registrados no caixa principal!");
    },
  });

  // Toggle pedido selection
  const togglePedido = (id: string) => {
    setSelectedPedidos((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const pedidosPendentes = (pedidosEntregador ?? []).filter((p: any) => p.pedido_status === "saiu_entrega");
  const pedidosEntregues = (pedidosEntregador ?? []).filter((p: any) => p.pedido_status === "entregue");

  const selectAllPendentes = () => {
    if (selectedPedidos.size === pedidosPendentes.length) {
      setSelectedPedidos(new Set());
    } else {
      setSelectedPedidos(new Set(pedidosPendentes.map((p: any) => p.id)));
    }
  };

  // Sum of selected deliveries
  const somaSelected = pedidosPendentes
    .filter((p: any) => selectedPedidos.has(p.id))
    .reduce((sum: number, p: any) => sum + Number(p.total), 0);

  // Open receb dialog with pre-filled value
  const openRecebDialog = () => {
    setPagamentos([{ forma_pagamento_id: "", valor: somaSelected > 0 ? somaSelected.toFixed(2) : "" }]);
    setRecebDialog(true);
  };

  // Pagamento lines management
  const addPagamentoLinha = () => setPagamentos((prev) => [...prev, { forma_pagamento_id: "", valor: "" }]);
  const removePagamentoLinha = (idx: number) => setPagamentos((prev) => prev.filter((_, i) => i !== idx));
  const updatePagamentoLinha = (idx: number, field: keyof PagamentoLinha, value: string) => {
    setPagamentos((prev) => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };
  const totalPagamentos = pagamentos.reduce((s, l) => s + (parseFloat(l.valor) || 0), 0);

  // Cálculos
  const suprimento = caixaAberto?.suprimento ?? 0;
  const totalEntregas = (pedidosEntregador ?? [])
    .reduce((sum: number, p: any) => sum + Number(p.total), 0);
  const totalEsperado = suprimento + totalEntregas;
  const totalRecebido = (recebimentos ?? []).reduce((sum: number, r: any) => sum + Number(r.valor), 0);
  const saldo = totalEsperado - totalRecebido;

  const entregadorNome = entregadores?.find((e) => e.id === entregadorId)?.nome;

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Wallet className="h-6 w-6" />Acerto Entregador</h2>

        <div className="flex items-center gap-3">
          <Select value={entregadorId} onValueChange={(v) => { setEntregadorId(v); setSelectedPedidos(new Set()); }}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Selecione um entregador" />
            </SelectTrigger>
            <SelectContent>
              {entregadores?.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {entregadorId && !caixaAberto && (
          <Card>
            <CardContent className="p-6 text-center space-y-3">
              <p className="text-muted-foreground">Nenhum caixa aberto para <strong>{entregadorNome}</strong>.</p>
              <Button onClick={() => setSuprimentoDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />Abrir Caixa / Suprimento
              </Button>
            </CardContent>
          </Card>
        )}

        {caixaAberto && (
          <>
            {/* Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Suprimento</p>
                  <p className="text-lg font-bold">{formatBRL(suprimento)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Total Entregas</p>
                  <p className="text-lg font-bold">{formatBRL(totalEntregas)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Total Esperado</p>
                  <p className="text-lg font-bold text-primary">{formatBRL(totalEsperado)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Saldo Devedor</p>
                  <p className={`text-lg font-bold ${saldo > 0.01 ? "text-destructive" : "text-green-600"}`}>
                    {formatBRL(saldo)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Entregas pendentes (saiu_entrega) */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Em Rota ({pedidosPendentes.length})</CardTitle>
                <div className="flex items-center gap-2">
                  {selectedPedidos.size > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {selectedPedidos.size} selecionado(s) · {formatBRL(somaSelected)}
                    </span>
                  )}
                  <Button
                    size="sm"
                    disabled={selectedPedidos.size === 0}
                    onClick={openRecebDialog}
                  >
                    <Plus className="h-4 w-4 mr-1" />Receber
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={pedidosPendentes.length > 0 && selectedPedidos.size === pedidosPendentes.length}
                          onCheckedChange={selectAllPendentes}
                        />
                      </TableHead>
                      <TableHead>#</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Pgto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pedidosPendentes.map((p: any) => (
                      <TableRow
                        key={p.id}
                        className={`cursor-pointer ${selectedPedidos.has(p.id) ? "bg-primary/5" : ""}`}
                        onClick={() => togglePedido(p.id)}
                      >
                        <TableCell>
                          <Checkbox checked={selectedPedidos.has(p.id)} onCheckedChange={() => togglePedido(p.id)} />
                        </TableCell>
                        <TableCell className="font-mono">{p.numero_sequencial}</TableCell>
                        <TableCell>{p.cliente_nome}</TableCell>
                        <TableCell>{formatBRL(p.total)}</TableCell>
                        <TableCell>
                          {p.pagar_na_entrega
                            ? <Badge variant="destructive" className="text-xs">Na entrega</Badge>
                            : <Badge variant="secondary" className="text-xs">Pré-pago</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                    {pedidosPendentes.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Nenhuma entrega em rota.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Entregas finalizadas */}
            {pedidosEntregues.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Entregues ({pedidosEntregues.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Pgto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pedidosEntregues.map((p: any) => (
                        <TableRow key={p.id} className="opacity-70">
                          <TableCell className="font-mono">{p.numero_sequencial}</TableCell>
                          <TableCell>{p.cliente_nome}</TableCell>
                          <TableCell>{formatBRL(p.total)}</TableCell>
                          <TableCell>
                            {p.pagar_na_entrega
                              ? <Badge variant="destructive" className="text-xs">Na entrega</Badge>
                              : <Badge variant="secondary" className="text-xs">Pré-pago</Badge>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Recebimentos */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recebimentos ({recebimentos?.length ?? 0}) — Total: {formatBRL(totalRecebido)}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Forma</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(recebimentos ?? []).map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell>{formatTime(r.created_at)}</TableCell>
                        <TableCell className="font-semibold">{formatBRL(r.valor)}</TableCell>
                        <TableCell>{(r.formas_pagamento as any)?.nome ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                    {(recebimentos ?? []).length === 0 && (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-4">Nenhum recebimento.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Fechar caixa */}
            <div className="flex justify-end">
              <Button variant="destructive" onClick={() => fecharCaixa.mutate()} disabled={fecharCaixa.isPending}>
                <Lock className="h-4 w-4 mr-1" />
                {fecharCaixa.isPending ? "Fechando..." : "Fechar Caixa do Entregador"}
              </Button>
            </div>
          </>
        )}

        {/* Dialog suprimento */}
        <Dialog open={suprimentoDialog} onOpenChange={setSuprimentoDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Abrir Caixa — Suprimento</DialogTitle>
              <DialogDescription>Informe o valor de troco adiantado para o entregador.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Valor do suprimento (troco adiantado)</Label>
              <Input type="number" step="0.01" min="0" value={suprimentoValor} onChange={(e) => setSuprimentoValor(e.target.value)} placeholder="0,00" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSuprimentoDialog(false)}>Cancelar</Button>
              <Button onClick={() => abrirCaixa.mutate()} disabled={abrirCaixa.isPending}>
                {abrirCaixa.isPending ? "Abrindo..." : "Abrir Caixa"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog recebimento com múltiplas formas */}
        <Dialog open={recebDialog} onOpenChange={setRecebDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Receber Entregas</DialogTitle>
              <DialogDescription>
                {selectedPedidos.size} entrega(s) selecionada(s) — Total: {formatBRL(somaSelected)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {pagamentos.map((linha, idx) => (
                <div key={idx} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    {idx === 0 && <Label className="text-xs">Forma de Pagamento</Label>}
                    <Select value={linha.forma_pagamento_id} onValueChange={(v) => updatePagamentoLinha(idx, "forma_pagamento_id", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {formasPag?.map((f) => (
                          <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-28 space-y-1">
                    {idx === 0 && <Label className="text-xs">Valor</Label>}
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={linha.valor}
                      onChange={(e) => updatePagamentoLinha(idx, "valor", e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                  {pagamentos.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removePagamentoLinha(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full" onClick={addPagamentoLinha}>
                <Plus className="h-4 w-4 mr-1" />Adicionar forma de pagamento
              </Button>
              <Separator />
              <div className="flex justify-between text-sm font-medium">
                <span>Total lançado:</span>
                <span className={totalPagamentos.toFixed(2) === somaSelected.toFixed(2) ? "text-green-600" : "text-destructive"}>
                  {formatBRL(totalPagamentos)}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRecebDialog(false)}>Cancelar</Button>
              <Button
                onClick={() => lancarRecebimento.mutate()}
                disabled={lancarRecebimento.isPending || pagamentos.every((l) => !l.forma_pagamento_id || parseFloat(l.valor) <= 0)}
              >
                {lancarRecebimento.isPending ? "Lançando..." : "Confirmar Recebimento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
