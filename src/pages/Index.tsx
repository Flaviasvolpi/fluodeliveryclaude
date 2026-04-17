import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import PublicLayout from "@/components/layout/PublicLayout";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useOrigem } from "@/contexts/OrigemContext";
import type { Produto, ProdutoVariante } from "@/types/database";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import ProductDialog from "@/components/ProductDialog";
import ProductCard from "@/components/ProductCard";
import LojaFechadaBanner from "@/components/LojaFechadaBanner";

export default function Index() {
  useOrigem();
  const { empresaId, empresa } = useEmpresa();
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);
  const isScrollingRef = useRef(false);
  const catBarRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const { data: bannerUrl } = useQuery({
    queryKey: ["config-banner", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/configuracoes`);
      const banner = data.find((c: any) => c.chave === "banner_url");
      return banner?.valor || empresa.banner_url || "";
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: categorias } = useQuery({
    queryKey: ["categorias", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/categorias/active`);
      return data;
    },
  });

  const { data: produtos, isLoading } = useQuery({
    queryKey: ["produtos", empresaId, search],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const { data } = await api.get(`/empresas/${empresaId}/produtos/active`, { params });
      return data;
    },
  });

  const sections = useMemo(() => {
    if (!categorias || !produtos) return [];
    const groups: { id: string; nome: string; items: typeof produtos }[] = [];
    for (const cat of categorias) {
      const items = produtos.filter((p: any) => p.categoria_id === cat.id);
      if (items.length > 0) groups.push({ id: cat.id, nome: cat.nome, items });
    }
    const uncategorized = produtos.filter((p: any) => !p.categoria_id);
    if (uncategorized.length > 0) {
      groups.push({ id: "__outros", nome: "Outros", items: uncategorized });
    }
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
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );
    const refs = sectionRefs.current;
    for (const id of Object.keys(refs)) {
      const el = refs[id];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections, search]);

  useEffect(() => {
    const bar = catBarRef.current;
    if (!activeCat || !bar) return;
    const btn = bar.querySelector(`[data-cat-btn="${activeCat}"]`) as HTMLElement | null;
    if (btn) {
      const scrollLeft = btn.offsetLeft - bar.offsetWidth / 2 + btn.offsetWidth / 2;
      bar.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [activeCat]);

  const scrollToSection = useCallback((catId: string) => {
    const el = sectionRefs.current[catId];
    if (!el) return;
    isScrollingRef.current = true;
    setActiveCat(catId);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => { isScrollingRef.current = false; }, 800);
  }, []);

  const scrollToTop = useCallback(() => {
    setActiveCat(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);




  const isSearching = search.length > 0;

  return (
    <PublicLayout>
      {bannerUrl && (
        <div className="w-full">
          <img src={bannerUrl} alt="Banner" className="w-full aspect-[2.5/1] md:aspect-[4/1] max-h-[280px] object-cover" />
        </div>
      )}
      <div className="container px-4 py-4 space-y-0 max-w-[100vw]">
        <LojaFechadaBanner empresaId={empresaId} className="mb-4" />
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar produtos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        {!isSearching && categorias && categorias.length > 0 && (
          <div ref={catBarRef} className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none sticky top-14 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border pt-3 -mx-4 px-4 shadow-sm">
            <Button variant={activeCat === null ? "default" : "outline"} size="default" onClick={scrollToTop} className="text-base font-semibold whitespace-nowrap">Todos</Button>
            {sections.map((s) => (
              <Button key={s.id} data-cat-btn={s.id} variant={activeCat === s.id ? "default" : "outline"} size="default" onClick={() => scrollToSection(s.id)} className="whitespace-nowrap text-base font-semibold">{s.nome}</Button>
            ))}
          </div>
        )}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3].map((i) => (<Card key={i} className="p-4"><LoadingSkeleton lines={4} /></Card>))}
          </div>
        ) : isSearching ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 min-w-0 w-full max-w-full overflow-hidden">
              {produtos?.map((p: any) => (
                <ProductCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} />
              ))}
            </div>
            {produtos?.length === 0 && <div className="text-center py-12 text-muted-foreground">Nenhum produto encontrado.</div>}
          </>
        ) : (
          <div className="space-y-8">
            {sections.map((section) => (
              <div key={section.id} ref={(el) => { sectionRefs.current[section.id] = el; }} data-cat-id={section.id} className="scroll-mt-28">
                <h2 className="text-2xl font-bold text-foreground mb-4">{section.nome}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 min-w-0 w-full max-w-full overflow-hidden">
                  {section.items.map((p: any) => (
                    <ProductCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} />
                  ))}
                </div>
              </div>
            ))}
            {sections.length === 0 && !isLoading && <div className="text-center py-12 text-muted-foreground">Nenhum produto encontrado.</div>}
          </div>
        )}
      </div>
      {selectedProduct && (
        <ProductDialog produto={selectedProduct as any} open={!!selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </PublicLayout>
  );
}



