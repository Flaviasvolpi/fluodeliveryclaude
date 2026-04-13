import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Minus, ArrowLeft } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatBRL } from "@/lib/format";
import type { Produto, ProdutoVariante, AdicionaisGrupo, AdicionaisItem } from "@/types/database";
import type { CartItemAdicional } from "@/types/cart";

interface ProductDialogProps {
  produto: Produto & { produto_variantes?: ProdutoVariante[] };
  open: boolean;
  onClose: () => void;
}

export default function ProductDialog({ produto, open, onClose }: ProductDialogProps) {
  const { empresaId } = useEmpresa();
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [obs, setObs] = useState("");
  const [selectedAdicionais, setSelectedAdicionais] = useState<Record<string, CartItemAdicional[]>>({});
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);

  const activeVariants = (produto.produto_variantes ?? []).filter((v) => v.ativo);

  const { data: gruposData } = useQuery({
    queryKey: ["produto-adicionais", produto.id],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/produtos/${produto.id}/adicionais-grupos`);
      return (data ?? []) as (AdicionaisGrupo & { adicionais_itens: AdicionaisItem[] })[];
    },
  });

  const { data: ingredientes } = useQuery({
    queryKey: ["produto-ingredientes", produto.id],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/produtos/${produto.id}/ingredientes`);
      return data ?? [];
    },
  });

  function toggleAdicional(grupoId: string, item: AdicionaisItem, maxSelect: number) {
    setSelectedAdicionais((prev) => {
      const current = prev[grupoId] ?? [];
      const exists = current.find((a) => a.adicional_item_id === item.id);
      if (exists) return { ...prev, [grupoId]: current.filter((a) => a.adicional_item_id !== item.id) };
      if (current.length >= maxSelect) return prev;
      return { ...prev, [grupoId]: [...current, { adicional_item_id: item.id, nome: item.nome, preco: item.preco, qtd: 1 }] };
    });
  }

  function toggleIngredient(nome: string) {
    setRemovedIngredients((prev) =>
      prev.includes(nome) ? prev.filter((n) => n !== nome) : [...prev, nome]
    );
  }

  function getPrice(): number {
    if (produto.possui_variantes && selectedVariant) {
      return activeVariants.find((v) => v.id === selectedVariant)?.preco_venda ?? 0;
    }
    return produto.preco_base ?? 0;
  }

  function getCost(): number {
    if (produto.possui_variantes && selectedVariant) {
      return activeVariants.find((v) => v.id === selectedVariant)?.custo ?? 0;
    }
    return produto.custo_base ?? 0;
  }

  function canAdd(): boolean {
    if (produto.possui_variantes && !selectedVariant) return false;
    if (gruposData) {
      for (const g of gruposData) {
        if ((selectedAdicionais[g.id]?.length ?? 0) < g.min_select) return false;
      }
    }
    return true;
  }

  function handleAdd() {
    if (!canAdd()) return;
    const variant = activeVariants.find((v) => v.id === selectedVariant);

    // Build observation including removed ingredients
    let finalObs = obs;
    if (removedIngredients.length > 0) {
      const semText = `SEM: ${removedIngredients.join(", ")}`;
      finalObs = finalObs ? `${semText} | ${finalObs}` : semText;
    }

    addItem({
      id: crypto.randomUUID(),
      produto_id: produto.id,
      produto_nome: produto.nome,
      produto_imagem_url: produto.imagem_url,
      variante_id: variant?.id ?? null,
      variante_nome: variant?.nome ?? null,
      preco_unit: getPrice(),
      custo_unit: getCost(),
      qtd: qty,
      observacao: finalObs || undefined,
      adicionais: Object.values(selectedAdicionais).flat(),
    });
    onClose();
  }

  const totalAdicionais = Object.values(selectedAdicionais).flat().reduce((s, a) => s + a.preco * a.qtd, 0);
  const unitTotal = getPrice() + totalAdicionais;
  const removableIngredients = ingredientes?.filter((i) => i.removivel) ?? [];
  const nonRemovableIngredients = ingredientes?.filter((i) => !i.removivel) ?? [];

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] sm:max-h-[90vh] flex flex-col overflow-hidden p-4 sm:p-6">
        <div className="flex-1 overflow-y-auto space-y-4 pb-2">
          <DialogHeader><DialogTitle>{produto.nome}</DialogTitle></DialogHeader>
          {produto.imagem_url && <img src={produto.imagem_url} alt={produto.nome} className="w-full rounded-lg aspect-[16/10] sm:aspect-video object-cover" />}
          {produto.descricao && <p className="text-sm text-muted-foreground">{produto.descricao}</p>}

          {/* Ingredients display */}
          {ingredientes && ingredientes.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Ingredientes</Label>
              {nonRemovableIngredients.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {nonRemovableIngredients.map((ing) => (
                    <Badge key={ing.id} variant="secondary" className="text-xs">{ing.nome}</Badge>
                  ))}
                </div>
              )}
              {removableIngredients.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Desmarque para remover:</span>
                  {removableIngredients.map((ing) => {
                    const isRemoved = removedIngredients.includes(ing.nome);
                    return (
                      <div
                        key={ing.id}
                        className="flex items-center gap-2 p-2 rounded-lg border hover:border-primary/50 cursor-pointer"
                        onClick={() => toggleIngredient(ing.nome)}
                      >
                        <Checkbox checked={!isRemoved} />
                        <span className={`text-sm ${isRemoved ? "line-through text-muted-foreground" : ""}`}>{ing.nome}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {produto.possui_variantes && activeVariants.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Escolha uma opção *</Label>
              <RadioGroup value={selectedVariant ?? ""} onValueChange={setSelectedVariant}>
                {activeVariants.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value={v.id} id={v.id} />
                      <Label htmlFor={v.id} className="cursor-pointer">{v.nome}</Label>
                    </div>
                    <span className="text-sm font-medium text-primary">{formatBRL(v.preco_venda)}</span>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {gruposData?.map((g) => {
            const activeItems = g.adicionais_itens.filter((i) => i.ativo);
            if (!activeItems.length) return null;
            return (
              <div key={g.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{g.nome}</Label>
                  <Badge variant="outline" className="text-xs">{g.min_select > 0 ? `Mín. ${g.min_select}` : "Opcional"} · Máx. {g.max_select}</Badge>
                </div>
                {activeItems.map((item) => {
                  const isChecked = !!selectedAdicionais[g.id]?.find((a) => a.adicional_item_id === item.id);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 cursor-pointer" onClick={() => toggleAdicional(g.id, item, g.max_select)}>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={isChecked} />
                        <span className="text-sm">{item.nome}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">+ {formatBRL(item.preco)}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}

          <div className="space-y-2">
            <Label className="text-sm">Observação</Label>
            <Textarea placeholder="Ex: bem passado, caprichar no molho..." value={obs} onChange={(e) => setObs(e.target.value)} rows={2} className="resize-none w-full min-w-0" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t bg-background sticky bottom-0">
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></Button>
            <span className="font-medium w-6 text-center text-sm">{qty}</span>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setQty(qty + 1)}><Plus className="h-4 w-4" /></Button>
          </div>
          <Button onClick={handleAdd} disabled={!canAdd()} className="gap-1.5 text-sm shrink-0">Adicionar {formatBRL(unitTotal * qty)}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
