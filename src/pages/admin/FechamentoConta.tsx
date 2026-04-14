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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { formatBRL } from "@/lib/format";
import { ArrowLeft, CheckCircle2, Receipt, UtensilsCrossed, TicketCheck, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type SplitMode = "unica" | "igual" | "valor" | "item";

interface PessoaPagamento {
  label: string;
  valor: number;
  forma_pagamento_id: string | null;
  itemIds?: string[]; // for item-based split
}

export default function FechamentoConta() {
  const { empresaId } = useEmpresa();
  const queryClient = useQueryClient();
  const [selectedContaId, setSelectedContaId] = useState<string | null>(null);
  const [splitMode, setSplitMode] = useState<SplitMode>("unica");
  const [numPessoas, setNumPessoas] = useState(2);
  const [pessoas, setPessoas] = useState<PessoaPagamento[]>([]);

  // Fetch open contas
  const { data: contas, isLoading } = useQuery({
    queryKey: ["contas-abertas", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/contas`);
      return data;
    },
  });

  // Fetch pedidos for selected conta
  const { data: pedidosConta } = useQuery({
    queryKey: ["pedidos-conta", selectedContaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/pedidos`);
      return data;
    },
    enabled: !!selectedContaId,
  });

  const { data: formasPag } = useQuery({
    queryKey: ["formas-pag-fechamento", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/formas-pagamento`);
      return data ?? [];
    },
  });

  const selectedConta = contas?.find((c) => c.id === selectedContaId);

  const allItems = useMemo(() => {
    if (!pedidosConta) return [];
    return pedidosConta.flatMap((p) =>
      (p.itens || []).map((item: any) => ({
        ...item,
        pedido_numero: p.numero_sequencial,
        cliente_nome: p.cliente_nome,
      }))
    );
  }, [pedidosConta]);

  const contaTotal = selectedConta?.total ?? 0;

  // Initialize pessoas when split mode changes
  const initPessoas = (mode: SplitMode) => {
    setSplitMode(mode);
    if (mode === "unica") {
      setPessoas([{ label: "Pagamento único", valor: contaTotal, forma_pagamento_id: null }]);
    } else if (mode === "igual") {
      const val = Math.round((contaTotal / numPessoas) * 100) / 100;
      const diff = Math.round((contaTotal - val * numPessoas) * 100) / 100;
      setPessoas(
        Array.from({ length: numPessoas }, (_, i) => ({
          label: `Pessoa ${i + 1}`,
          valor: i === 0 ? val + diff : val,
          forma_pagamento_id: null,
        }))
      );
    } else if (mode === "valor") {
      setPessoas([
        { label: "Pessoa 1", valor: contaTotal, forma_pagamento_id: null },
      ]);
    } else if (mode === "item") {
      setPessoas([{ label: "Pessoa 1", valor: 0, forma_pagamento_id: null, itemIds: [] }]);
    }
  };

  const recalcEqualSplit = (n: number) => {
    setNumPessoas(n);
    const val = Math.round((contaTotal / n) * 100) / 100;
    const diff = Math.round((contaTotal - val * n) * 100) / 100;
    setPessoas(
      Array.from({ length: n }, (_, i) => ({
        label: `Pessoa ${i + 1}`,
        valor: i === 0 ? val + diff : val,
        forma_pagamento_id: null,
      }))
    );
  };

  const totalPago = pessoas.reduce((sum, p) => sum + (p.valor || 0), 0);
  const restante = Math.round((contaTotal - totalPago) * 100) / 100;

  const addPessoa = () => {
    setPessoas([...pessoas, { label: `Pessoa ${pessoas.length + 1}`, valor: 0, forma_pagamento_id: null, itemIds: splitMode === "item" ? [] : undefined }]);
  };

  const updatePessoa = (idx: number, field: keyof PessoaPagamento, value: any) => {
    setPessoas((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  };

  const toggleItemForPessoa = (pessoaIdx: number, itemId: string) => {
    setPessoas((prev) =>
      prev.map((p, i) => {
        if (i !== pessoaIdx) return p;
        const ids = p.itemIds || [];
        const newIds = ids.includes(itemId) ? ids.filter((id) => id !== itemId) : [...ids, itemId];
        const total = allItems.filter((it) => newIds.includes(it.id)).reduce((sum, it) => {
          const itemTotal = it.preco_unit_snapshot * it.qtd + (it.adicionais || []).reduce((s: number, a: any) => s + a.preco_snapshot * a.qtd, 0);
          return sum + itemTotal;
        }, 0);
        return { ...p, itemIds: newIds, valor: Math.round(total * 100) / 100 };
      })
    );
  };

  const isItemAssigned = (itemId: string) => pessoas.some((p) => p.itemIds?.includes(itemId));

  const closeConta = useMutation({
    mutationFn: async () => {
      if (!selectedContaId || !selectedConta) throw new Error("Conta não selecionada");
      if (splitMode !== "item" && Math.abs(restante) > 0.01) throw new Error("O valor total dos pagamentos não confere");
      if (pessoas.some((p) => !p.forma_pagamento_id)) throw new Error("Selecione a forma de pagamento para todas as pessoas");

      // Insert payments
      for (const p of pessoas) {
        await api.post(`/empresas/${empresaId}/contas/pagamentos`, {
          empresa_id: empresaId,
          conta_id: selectedContaId,
          forma_pagamento_id: p.forma_pagamento_id,
          valor: p.valor,
          pessoa_label: p.label,
        });
      }

      // Close conta
      await api.post(`/empresas/${empresaId}/contas/${selectedContaId}/fechar`);

      // Update pedidos pagamento_status
      const pedidoIds = pedidosConta?.map((p) => p.id) ?? [];
      if (pedidoIds.length > 0) {
        for (const pid of pedidoIds) {
          await api.patch(`/empresas/${empresaId}/pedidos/${pid}`, { pagamento_status: "pago" });
        }
      }

      // Register caixa_recebimentos if there's an open session today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: sessoes } = await api.get(`/empresas/${empresaId}/caixa/sessoes`, {
        params: { status: "aberto" }
      });
      const sessao = Array.isArray(sessoes) ? sessoes[0] : sessoes;

      if (sessao) {
        for (const p of pessoas) {
          await api.post(`/empresas/${empresaId}/caixa/recebimentos`, {
            empresa_id: empresaId,
            caixa_sessao_id: sessao.id,
            conta_id: selectedContaId,
            forma_pagamento_id: p.forma_pagamento_id,
            valor: p.valor,
            tipo_origem: "conta",
          });
        }
      }
    },
    onSuccess: () => {
      toast.success("Conta fechada com sucesso!");
      setSelectedContaId(null);
      setPessoas([]);
      setSplitMode("unica");
      queryClient.invalidateQueries({ queryKey: ["contas-abertas"] });
      queryClient.invalidateQueries({ queryKey: ["caixa-recebimentos"] });
    },
    onError: (err: any) => toast.error(err.message || "Erro ao fechar conta"),
  });

  // Detail view
  if (selectedContaId && selectedConta) {
    return (
      <AdminLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => { setSelectedContaId(null); setPessoas([]); }}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            <h2 className="text-xl font-bold">Fechar Conta</h2>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {selectedConta.tipo === "mesa" ? <UtensilsCrossed className="h-5 w-5" /> : <TicketCheck className="h-5 w-5" />}
                  {selectedConta.tipo === "mesa"
                    ? `Mesa ${(selectedConta as any).mesa?.numero ?? ""} — ${(selectedConta as any).mesa?.nome ?? ""}`
                    : `Comanda #${selectedConta.referencia}`}
                </span>
                <Badge variant="secondary" className="text-lg">{formatBRL(contaTotal)}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{pedidosConta?.length ?? 0} pedido(s)</p>
              <Separator />
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {allItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.qtd}x {item.nome_snapshot}
                      {item.variante_nome_snapshot && ` (${item.variante_nome_snapshot})`}
                    </span>
                    <span className="text-muted-foreground">
                      {formatBRL(item.preco_unit_snapshot * item.qtd + (item.adicionais || []).reduce((s: number, a: any) => s + a.preco_snapshot * a.qtd, 0))}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Split mode selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Modo de pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={splitMode} onValueChange={(v) => initPessoas(v as SplitMode)} className="grid grid-cols-2 gap-3">
                {[
                  { value: "unica", label: "Conta única" },
                  { value: "igual", label: "Dividir igualmente" },
                  { value: "valor", label: "Dividir por valor" },
                  { value: "item", label: "Dividir por item" },
                ].map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2 border rounded-lg p-3">
                    <RadioGroupItem value={opt.value} id={`mode-${opt.value}`} />
                    <Label htmlFor={`mode-${opt.value}`} className="cursor-pointer">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>

              {splitMode === "igual" && (
                <div className="mt-4 flex items-center gap-3">
                  <Label>Nº de pessoas:</Label>
                  <Input type="number" min={2} max={20} className="w-20" value={numPessoas} onChange={(e) => recalcEqualSplit(Math.max(2, parseInt(e.target.value) || 2))} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payments list */}
          {pessoas.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Pagamentos</span>
                  {(splitMode === "valor" || splitMode === "item") && (
                    <Button variant="outline" size="sm" onClick={addPessoa}><Users className="h-4 w-4 mr-1" /> Adicionar pessoa</Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pessoas.map((pessoa, idx) => (
                  <div key={idx} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <Input
                        value={pessoa.label}
                        onChange={(e) => updatePessoa(idx, "label", e.target.value)}
                        className="font-medium"
                        placeholder="Nome"
                      />
                      {splitMode === "valor" && (
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          className="w-32"
                          value={pessoa.valor || ""}
                          onChange={(e) => updatePessoa(idx, "valor", parseFloat(e.target.value) || 0)}
                        />
                      )}
                      {(splitMode === "unica" || splitMode === "igual") && (
                        <Badge variant="outline" className="text-sm whitespace-nowrap">{formatBRL(pessoa.valor)}</Badge>
                      )}
                      {splitMode === "item" && (
                        <Badge variant="outline" className="text-sm whitespace-nowrap">{formatBRL(pessoa.valor)}</Badge>
                      )}
                    </div>

                    <Select value={pessoa.forma_pagamento_id ?? ""} onValueChange={(v) => updatePessoa(idx, "forma_pagamento_id", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Forma de pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {formasPag?.map((f) => (
                          <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Item selection for "item" mode */}
                    {splitMode === "item" && (
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {allItems.map((item) => {
                          const assignedElsewhere = !pessoa.itemIds?.includes(item.id) && isItemAssigned(item.id);
                          const itemTotal = item.preco_unit_snapshot * item.qtd + (item.adicionais || []).reduce((s: number, a: any) => s + a.preco_snapshot * a.qtd, 0);
                          return (
                            <div key={item.id} className={`flex items-center gap-2 text-sm p-1.5 rounded ${assignedElsewhere ? "opacity-40" : ""}`}>
                              <Checkbox
                                checked={pessoa.itemIds?.includes(item.id) ?? false}
                                disabled={assignedElsewhere}
                                onCheckedChange={() => toggleItemForPessoa(idx, item.id)}
                              />
                              <span className="flex-1">{item.qtd}x {item.nome_snapshot}</span>
                              <span className="text-muted-foreground">{formatBRL(itemTotal)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {pessoas.length > 1 && splitMode !== "unica" && splitMode !== "igual" && (
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setPessoas((prev) => prev.filter((_, i) => i !== idx))}>
                        Remover
                      </Button>
                    )}
                  </div>
                ))}

                <Separator />
                <div className="flex justify-between items-center text-sm">
                  <span>Total pago:</span>
                  <span className="font-bold">{formatBRL(totalPago)}</span>
                </div>
                {splitMode !== "item" && (
                  <div className={`flex justify-between items-center text-sm ${Math.abs(restante) > 0.01 ? "text-destructive" : "text-primary"}`}>
                    <span>Restante:</span>
                    <span className="font-bold">{formatBRL(restante)}</span>
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  disabled={closeConta.isPending || (splitMode !== "item" && Math.abs(restante) > 0.01) || pessoas.some((p) => !p.forma_pagamento_id)}
                  onClick={() => closeConta.mutate()}
                >
                  {closeConta.isPending ? "Fechando..." : `Fechar Conta · ${formatBRL(contaTotal)}`}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </AdminLayout>
    );
  }

  // List view
  return (
    <AdminLayout>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Receipt className="h-6 w-6" /> Fechar Conta
        </h2>
        <p className="text-muted-foreground">Selecione uma conta aberta para fechar.</p>

        {isLoading ? (
          <p className="text-center py-12 text-muted-foreground">Carregando...</p>
        ) : !contas?.length ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-primary/40" />
              <p>Nenhuma conta aberta no momento.</p>
              <p className="text-xs mt-1">As contas são criadas automaticamente ao fazer pedidos de mesa ou comanda no Atendimento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {contas.map((conta) => (
              <Card
                key={conta.id}
                className="cursor-pointer hover:border-primary/50 transition-all active:scale-[0.98]"
                onClick={() => { setSelectedContaId(conta.id); initPessoas("unica"); }}
              >
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {conta.tipo === "mesa" ? <UtensilsCrossed className="h-5 w-5 text-amber-500" /> : <TicketCheck className="h-5 w-5 text-violet-500" />}
                      <span className="font-bold text-lg">
                        {conta.tipo === "mesa"
                          ? `Mesa ${(conta as any).mesa?.numero ?? "?"}`
                          : `Comanda #${conta.referencia}`}
                      </span>
                    </div>
                    <Badge variant="outline">{formatBRL(conta.total)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Aberta em {new Date(conta.created_at).toLocaleString("pt-BR")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
