import { Link, useNavigate } from "react-router-dom";
import PublicLayout from "@/components/layout/PublicLayout";
import { useCart } from "@/contexts/CartContext";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";
import { calcItemSubtotal, calcCartTotal } from "@/types/cart";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";

export default function Carrinho() {
  const { items, removeItem, updateQty, itemCount } = useCart();
  const navigate = useNavigate();
  const { slug } = useEmpresa();

  if (itemCount === 0) {
    return (
      <PublicLayout>
        <div className="container px-4 py-16 text-center space-y-4">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Seu carrinho está vazio</h2>
          <p className="text-muted-foreground">Adicione itens do cardápio para continuar.</p>
          <Link to={`/loja/${slug}`}>
            <Button>Ver cardápio</Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const total = calcCartTotal(items);

  return (
    <PublicLayout>
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Seu Carrinho</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.produto_nome}</h3>
                      {item.variante_nome && <p className="text-sm text-muted-foreground">{item.variante_nome}</p>}
                      {item.adicionais.length > 0 && <p className="text-xs text-muted-foreground mt-1">+ {item.adicionais.map((a) => a.nome).join(", ")}</p>}
                      {item.observacao && <p className="text-xs text-muted-foreground italic mt-1">Obs: {item.observacao}</p>}
                    </div>
                    <p className="font-bold text-primary">{formatBRL(calcItemSubtotal(item))}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(item.id, item.qtd - 1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-6 text-center text-sm">{item.qtd}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(item.id, item.qtd + 1)}><Plus className="h-3 w-3" /></Button>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="hidden md:block">
            <Card className="sticky top-20">
              <CardHeader><CardTitle className="text-base">Resumo</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.qtd}x {item.produto_nome}</span>
                    <span>{formatBRL(calcItemSubtotal(item))}</span>
                  </div>
                ))}
                <div className="border-t pt-3 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatBRL(total)}</span>
                </div>
                <Button className="w-full" size="lg" onClick={() => navigate(`/loja/${slug}/checkout`)}>Finalizar Pedido</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="sticky bottom-0 left-0 right-0 bg-background border-t p-4 space-y-3 md:hidden">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-lg font-bold text-primary">{formatBRL(total)}</span>
        </div>
        <Button className="w-full" size="lg" onClick={() => navigate(`/loja/${slug}/checkout`)}>Finalizar Pedido</Button>
      </div>
    </PublicLayout>
  );
}
