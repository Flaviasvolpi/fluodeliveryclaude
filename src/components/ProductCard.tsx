import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";
import { formatBRL } from "@/lib/format";
import type { Produto, ProdutoVariante } from "@/types/database";

type ProductWithVariants = Produto & { variantes?: ProdutoVariante[]; produto_variantes?: ProdutoVariante[] };

interface ProductCardProps {
  product: ProductWithVariants;
  onClick: () => void;
}

export function getDisplayPrice(p: ProductWithVariants): string {
  const variants = p.variantes ?? p.produto_variantes ?? [];
  if (p.possui_variantes && variants.length) {
    const activeVariants = variants.filter((v) => v.ativo);
    if (activeVariants.length) {
      const min = Math.min(...activeVariants.map((v) => Number(v.preco_venda)));
      return `A partir de ${formatBRL(min)}`;
    }
  }
  return p.preco_base ? formatBRL(p.preco_base) : "Sob consulta";
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <Card
      className="w-full min-w-0 overflow-hidden cursor-pointer hover:border-primary/50 transition-all active:scale-[0.98]"
      style={{ maxWidth: '100%', contain: 'inline-size' }}
      onClick={onClick}
    >
      {product.imagem_url ? (
        <div className="w-full aspect-square overflow-hidden rounded-t-lg relative">
          <img src={product.imagem_url} alt={product.nome} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        </div>
      ) : (
        <div className="w-full aspect-square overflow-hidden rounded-t-lg bg-muted flex items-center justify-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
        </div>
      )}
      <CardContent className="w-full min-w-0 p-4">
        <h3 className="font-semibold text-foreground truncate">{product.nome}</h3>
        {product.descricao && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{product.descricao}</p>}
        <p className="text-primary font-bold mt-2">{getDisplayPrice(product)}</p>
      </CardContent>
    </Card>
  );
}
