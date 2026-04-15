import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Plus, Loader2, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface Props { empresaId: string; onComplete: () => void; }

export default function Step6Cardapio({ empresaId, onComplete }: Props) {
  const [categoriaNome, setCategoriaNome] = useState("");
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [categoriaCriada, setCategoriaCriada] = useState(false);
  const [produtoNome, setProdutoNome] = useState("");
  const [produtoPreco, setProdutoPreco] = useState("");
  const [produtoDesc, setProdutoDesc] = useState("");
  const [produtoCriado, setProdutoCriado] = useState(false);
  const [loading, setLoading] = useState(false);

  async function criarCategoria() {
    if (!categoriaNome.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post(`/empresas/${empresaId}/categorias`, { nome: categoriaNome.trim() });
      setCategoriaId(data.id);
      setCategoriaCriada(true);
      toast.success("Categoria criada!");
    } catch { toast.error("Erro ao criar categoria"); }
    setLoading(false);
  }

  async function criarProduto() {
    if (!produtoNome.trim() || !produtoPreco) return;
    setLoading(true);
    try {
      await api.post(`/empresas/${empresaId}/produtos`, {
        nome: produtoNome.trim(),
        descricao: produtoDesc || null,
        preco_base: parseFloat(produtoPreco),
        categoria_id: categoriaId,
      });
      setProdutoCriado(true);
      toast.success("Produto criado!");
    } catch { toast.error("Erro ao criar produto"); }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">Monte seu cardápio</h2>
        <p className="text-sm text-muted-foreground">Crie sua primeira categoria e produto para ver como funciona</p>
      </div>

      {/* Categoria */}
      <div className={`p-4 rounded-lg border space-y-3 ${categoriaCriada ? "border-green-500/30 bg-green-50/50 dark:bg-green-950/20" : ""}`}>
        <div className="flex items-center gap-2">
          {categoriaCriada ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <span className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center text-xs font-bold text-primary">1</span>}
          <Label className="font-semibold">Criar uma categoria</Label>
        </div>
        {!categoriaCriada ? (
          <div className="flex gap-2">
            <Input value={categoriaNome} onChange={(e) => setCategoriaNome(e.target.value)} placeholder="Ex: Lanches, Pizzas, Bebidas..." className="flex-1" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), criarCategoria())} />
            <Button onClick={criarCategoria} disabled={loading || !categoriaNome.trim()}><Plus className="h-4 w-4 mr-1" /> Criar</Button>
          </div>
        ) : (
          <p className="text-sm text-green-600">Categoria "{categoriaNome}" criada com sucesso!</p>
        )}
      </div>

      {/* Produto */}
      <div className={`p-4 rounded-lg border space-y-3 transition-opacity ${categoriaCriada ? "" : "opacity-40 pointer-events-none"} ${produtoCriado ? "border-green-500/30 bg-green-50/50 dark:bg-green-950/20" : ""}`}>
        <div className="flex items-center gap-2">
          {produtoCriado ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <span className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center text-xs font-bold text-primary">2</span>}
          <Label className="font-semibold">Adicionar um produto</Label>
        </div>
        {!produtoCriado ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input value={produtoNome} onChange={(e) => setProdutoNome(e.target.value)} placeholder="Nome do produto" />
              <Input type="number" step="0.01" min="0.01" value={produtoPreco} onChange={(e) => setProdutoPreco(e.target.value)} placeholder="Preço (R$)" />
            </div>
            <Textarea value={produtoDesc} onChange={(e) => setProdutoDesc(e.target.value)} placeholder="Descrição (opcional)" rows={2} />
            <Button onClick={criarProduto} disabled={loading || !produtoNome.trim() || !produtoPreco} className="w-full"><Plus className="h-4 w-4 mr-1" /> Criar produto</Button>
          </div>
        ) : (
          <p className="text-sm text-green-600">Produto "{produtoNome}" criado por R$ {parseFloat(produtoPreco).toFixed(2)}!</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onComplete}>
          Pular por agora
        </Button>
        {produtoCriado && (
          <Button className="flex-1" onClick={onComplete}>
            Continuar <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center">Você pode adicionar mais categorias e produtos depois em Catálogo</p>
    </div>
  );
}
