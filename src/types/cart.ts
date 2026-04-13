export interface CartItemAdicional {
  adicional_item_id: string;
  nome: string;
  preco: number;
  qtd: number;
}

export interface CartItem {
  id: string; // unique cart item id (generated client-side)
  produto_id: string;
  produto_nome: string;
  produto_imagem_url?: string | null;
  variante_id?: string | null;
  variante_nome?: string | null;
  preco_unit: number;
  custo_unit: number;
  qtd: number;
  observacao?: string;
  adicionais: CartItemAdicional[];
}

export interface Cart {
  items: CartItem[];
}

export function calcItemSubtotal(item: CartItem): number {
  const adicionaisTotal = item.adicionais.reduce((sum, a) => sum + a.preco * a.qtd, 0);
  return (item.preco_unit + adicionaisTotal) * item.qtd;
}

export function calcCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + calcItemSubtotal(item), 0);
}
