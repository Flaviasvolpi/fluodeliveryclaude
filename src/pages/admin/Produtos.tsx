import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useEmpresa } from "@/contexts/EmpresaContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Image as ImageIcon, Salad, Copy, Upload, Download } from "lucide-react";
import { formatBRL } from "@/lib/format";
import type { Produto, ProdutoInsert, ProdutoVariante } from "@/types/database";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ImportError {
  aba: string;
  linha: number;
  coluna?: string;
  valor?: string;
  mensagem: string;
}

interface ImportResult {
  counts: {
    categorias: number;
    grupos: number;
    itens: number;
    produtos: number;
    variantes: number;
    ingredientes: number;
  };
  errors: ImportError[];
  warnings: ImportError[];
}

export default function Produtos() {
  const { empresaId } = useEmpresa();
  const qc = useQueryClient();
  const [editItem, setEditItem] = useState<Produto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [variantDialogProduct, setVariantDialogProduct] = useState<Produto | null>(null);
  const [ingredientDialogProduct, setIngredientDialogProduct] = useState<Produto | null>(null);
  const [importing, setImporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: produtos } = useQuery({
    queryKey: ["admin-produtos", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/produtos`);
      return data;
    },
  });

  const { data: categorias } = useQuery({
    queryKey: ["admin-categorias", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/categorias`);
      return data ?? [];
    },
  });

  const { data: adicionaisGrupos } = useQuery({
    queryKey: ["admin-adicionais-grupos", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/adicionais/grupos`);
      return data ?? [];
    },
  });

  const upsert = useMutation({
    mutationFn: async ({
      values,
      imageFile,
      grupoIds,
    }: {
      values: ProdutoInsert & { id?: string };
      imageFile?: File;
      grupoIds: string[];
    }) => {
      let imagem_url = values.imagem_url;

      if (imageFile) {
        const path = `${crypto.randomUUID()}-${imageFile.name}`;
        const formData = new FormData();
      formData.append("file", imageFile);
      const { data: uploadResult } = await api.post(`/uploads/product-images`, formData, { headers: { "Content-Type": "multipart/form-data" } });
        
        imagem_url = uploadResult?.url || path;
      }

      const payload = { ...values, imagem_url, empresa_id: empresaId, grupo_ids: grupoIds };

      if (values.id) {
        await api.patch(`/empresas/${empresaId}/produtos/${values.id}`, payload);
      } else {
        await api.post(`/empresas/${empresaId}/produtos`, payload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-produtos", empresaId] });
      setDialogOpen(false);
      setEditItem(null);
      toast.success("Produto salvo!");
    },
    onError: () => toast.error("Erro ao salvar produto."),
  });

  const duplicar = useMutation({
    mutationFn: async (produto: any) => {
      // 1. Insert new product (copy)
      const { id, created_at, categoria, variantes, ingredientes, adicionais_grupos, ...rest } = produto;
      const { data: novo } = await api.post(`/empresas/${empresaId}/produtos`, {
        nome: `${rest.nome} (Cópia)`,
        descricao: rest.descricao,
        categoria_id: rest.categoria_id,
        preco_base: rest.preco_base,
        custo_base: rest.custo_base,
        possui_variantes: rest.possui_variantes,
        ordem: rest.ordem,
      });
      const novoId = novo.id;

      // 2. Copy variants
      if (variantes?.length) {
        for (const v of variantes) {
          await api.post(`/empresas/${empresaId}/produto-variantes`, {
            produto_id: novoId,
            nome: v.nome,
            sku: v.sku,
            custo: v.custo,
            preco_venda: v.preco_venda,
            ordem: v.ordem,
            ativo: v.ativo,
          });
        }
      }

      // 3. Copy addons groups
      if (adicionais_grupos?.length) {
        for (const ag of adicionais_grupos) {
          await api.post(`/empresas/${empresaId}/produto-adicionais-grupos`, {
            produto_id: novoId,
            grupo_id: ag.grupo_id,
          });
        }
      }

      // 4. Copy ingredients
      if (ingredientes?.length) {
        for (const ing of ingredientes) {
          await api.post(`/empresas/${empresaId}/produto-ingredientes`, {
            produto_id: novoId,
            nome: ing.nome,
            removivel: ing.removivel,
            ordem: ing.ordem,
            ativo: ing.ativo,
          });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-produtos", empresaId] });
      toast.success("Produto duplicado!");
    },
    onError: () => toast.error("Erro ao duplicar produto."),
  });

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      await api.patch(`/empresas/${empresaId}/produtos/${id}`, { ativo });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-produtos", empresaId] }),
    onError: () => toast.error("Erro ao atualizar produto."),
  });

  const parseBool = (val: any): boolean => {
    if (typeof val === "boolean") return val;
    if (typeof val === "string") return val.trim().toUpperCase() === "SIM";
    return true;
  };

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Aba 1: Categorias (opcional)
    const catData = [
      ["nome", "descricao", "ordem"],
      ["Nome (obrigatório)", "Descrição (opcional)", "Número"],
      ["Lanches", "Hambúrgueres e sanduíches", 1],
      ["Pizzas", "Pizzas tradicionais", 2],
      ["Bebidas", "Refrigerantes e sucos", 3],
    ];
    const wsCat = XLSX.utils.aoa_to_sheet(catData);
    wsCat["!cols"] = [{ wch: 25 }, { wch: 35 }, { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, wsCat, "Categorias");

    // Aba 2: Grupos de Adicionais (opcional)
    const grpData = [
      ["nome", "min_select", "max_select"],
      ["Nome do grupo", "Mínimo (0 = opcional)", "Máximo"],
      ["Borda", 0, 1],
      ["Extras", 0, 5],
    ];
    const wsGrp = XLSX.utils.aoa_to_sheet(grpData);
    wsGrp["!cols"] = [{ wch: 22 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsGrp, "GruposAdicionais");

    // Aba 3: Itens de Adicionais (opcional)
    const itemData = [
      ["grupo", "nome", "preco"],
      ["Nome do grupo (igual aba GruposAdicionais)", "Nome do item", "Preço"],
      ["Borda", "Catupiry", 5.00],
      ["Borda", "Cheddar", 5.00],
      ["Extras", "Bacon", 3.50],
      ["Extras", "Ovo", 2.00],
    ];
    const wsItem = XLSX.utils.aoa_to_sheet(itemData);
    wsItem["!cols"] = [{ wch: 22 }, { wch: 22 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsItem, "ItensAdicionais");

    // Aba 4: Produtos (obrigatória)
    const prodData = [
      ["nome", "descricao", "categoria", "preco_base", "custo_base", "possui_variantes", "ativo", "ordem", "grupos_adicionais", "ingredientes"],
      ["Nome (obrigatório)", "Descrição (opcional)", "Nome da categoria", "Preço de venda", "Custo", "SIM ou NÃO", "SIM ou NÃO", "Número", "Grupos separados por ;", "Ingredientes separados por ;"],
      ["X-Burguer", "Hambúrguer artesanal", "Lanches", 25.90, 12.00, "NÃO", "SIM", 1, "Extras", "Pão;Carne;Queijo;Alface;Tomate"],
      ["Pizza", "Pizza artesanal", "Pizzas", null, null, "SIM", "SIM", 2, "Borda;Extras", "Massa;Molho;Queijo"],
      ["Coca-Cola 350ml", "", "Bebidas", 6.00, 3.00, "NÃO", "SIM", 3, "", ""],
    ];
    const wsProd = XLSX.utils.aoa_to_sheet(prodData);
    wsProd["!cols"] = [{ wch: 25 }, { wch: 30 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 8 }, { wch: 8 }, { wch: 25 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, wsProd, "Produtos");

    // Aba 5: Variantes (opcional — só para produtos com possui_variantes=SIM)
    const varData = [
      ["produto_nome", "variante_nome", "preco_venda", "custo", "sku", "ativo", "ordem"],
      ["Nome do produto (igual aba Produtos)", "Nome da variante", "Preço de venda", "Custo", "SKU (opcional)", "SIM ou NÃO", "Número"],
      ["Pizza", "Pequena", 29.90, 12.00, "PIZ-P", "SIM", 1],
      ["Pizza", "Média", 39.90, 18.00, "PIZ-M", "SIM", 2],
      ["Pizza", "Grande", 49.90, 24.00, "PIZ-G", "SIM", 3],
    ];
    const wsVar = XLSX.utils.aoa_to_sheet(varData);
    wsVar["!cols"] = [{ wch: 25 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsVar, "Variantes");

    XLSX.writeFile(wb, "modelo_importacao_completa.xlsx");
  };

  const handleImportFile = async (file: File) => {
    setImporting(true);
    const errors: ImportError[] = [];
    const warnings: ImportError[] = [];
    const counts = { categorias: 0, grupos: 0, itens: 0, produtos: 0, variantes: 0, ingredientes: 0 };

    const parseNum = (val: any, aba: string, linha: number, coluna: string): number | null => {
      if (val === null || val === undefined || val === "") return null;
      const str = String(val).replace(",", ".").trim();
      const n = Number(str);
      if (isNaN(n)) {
        errors.push({ aba, linha, coluna, valor: str, mensagem: `Valor "${str}" não é um número válido` });
        return null;
      }
      return n;
    };

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);

      const readSheet = (name: string): any[] => {
        const sheet = wb.Sheets[name];
        if (!sheet) return [];
        // Lê como array de arrays: linha 0 = cabeçalhos reais, linha 1 = descrições (descartada), linha 2+ = dados
        const aoa: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: false });
        if (aoa.length < 3) return [];
        const headers = (aoa[0] as any[]).map((h) => String(h ?? "").trim());
        return aoa.slice(2).map((row) => {
          const obj: any = {};
          headers.forEach((h, i) => {
            if (h) obj[h] = row[i] ?? null;
          });
          return obj;
        }).filter((r) => Object.values(r).some((v) => v !== null && v !== ""));
      };

      const catRows = readSheet("Categorias");
      const grpRows = readSheet("GruposAdicionais");
      const itemRows = readSheet("ItensAdicionais");
      const prodRows = readSheet("Produtos");
      const varRows = readSheet("Variantes");

      if (!prodRows.length && !catRows.length && !grpRows.length) {
        toast.error("Nenhuma aba do modelo contém dados.");
        return;
      }

      // ---------- 1. CATEGORIAS ----------
      const { data: existingCats } = await api.get(`/empresas/${empresaId}/categorias`);
      const catMap = new Map<string, string>(
        (existingCats ?? []).map((c: any) => [c.nome.toLowerCase().trim(), c.id])
      );

      for (let i = 0; i < catRows.length; i++) {
        const row = catRows[i];
        const linha = i + 3;
        const nome = String(row.nome ?? "").trim();
        if (!nome) continue;
        const key = nome.toLowerCase();
        if (catMap.has(key)) {
          warnings.push({ aba: "Categorias", linha, mensagem: `Categoria "${nome}" já existe, reaproveitada` });
          continue;
        }
        try {
          const { data: created } = await api.post(`/empresas/${empresaId}/categorias`, {
            empresa_id: empresaId,
            nome,
            descricao: row.descricao ? String(row.descricao) : null,
            ordem: Number(row.ordem ?? 0),
            ativo: true,
          });
          catMap.set(key, created.id);
          counts.categorias++;
        } catch (e: any) {
          errors.push({ aba: "Categorias", linha, mensagem: `Falha ao criar "${nome}": ${e.response?.data?.message || e.message}` });
        }
      }

      // ---------- 2. GRUPOS DE ADICIONAIS ----------
      const { data: existingGrupos } = await api.get(`/empresas/${empresaId}/adicionais/grupos`);
      const grpMap = new Map<string, string>(
        (existingGrupos ?? []).map((g: any) => [g.nome.toLowerCase().trim(), g.id])
      );

      for (let i = 0; i < grpRows.length; i++) {
        const row = grpRows[i];
        const linha = i + 3;
        const nome = String(row.nome ?? "").trim();
        if (!nome) continue;
        const key = nome.toLowerCase();
        if (grpMap.has(key)) {
          warnings.push({ aba: "GruposAdicionais", linha, mensagem: `Grupo "${nome}" já existe, reaproveitado` });
          continue;
        }
        const min = parseNum(row.min_select, "GruposAdicionais", linha, "min_select") ?? 0;
        const max = parseNum(row.max_select, "GruposAdicionais", linha, "max_select") ?? 1;
        try {
          const { data: created } = await api.post(`/empresas/${empresaId}/adicionais/grupos`, {
            empresa_id: empresaId,
            nome,
            min_select: min,
            max_select: max,
            minSelect: min,
            maxSelect: max,
          });
          grpMap.set(key, created.id);
          counts.grupos++;
        } catch (e: any) {
          errors.push({ aba: "GruposAdicionais", linha, mensagem: `Falha ao criar "${nome}": ${e.response?.data?.message || e.message}` });
        }
      }

      // ---------- 3. ITENS DE ADICIONAIS ----------
      for (let i = 0; i < itemRows.length; i++) {
        const row = itemRows[i];
        const linha = i + 3;
        const grupoNome = String(row.grupo ?? "").trim();
        const nome = String(row.nome ?? "").trim();
        if (!grupoNome || !nome) {
          if (nome || grupoNome) errors.push({ aba: "ItensAdicionais", linha, mensagem: "Linha precisa de 'grupo' e 'nome'" });
          continue;
        }
        const grupoId = grpMap.get(grupoNome.toLowerCase());
        if (!grupoId) {
          errors.push({ aba: "ItensAdicionais", linha, coluna: "grupo", valor: grupoNome, mensagem: `Grupo "${grupoNome}" não existe (adicione na aba GruposAdicionais)` });
          continue;
        }
        const preco = parseNum(row.preco, "ItensAdicionais", linha, "preco") ?? 0;
        try {
          await api.post(`/empresas/${empresaId}/adicionais/itens`, {
            empresa_id: empresaId,
            grupo_id: grupoId,
            grupoId: grupoId,
            nome,
            preco,
          });
          counts.itens++;
        } catch (e: any) {
          errors.push({ aba: "ItensAdicionais", linha, mensagem: `Falha ao criar "${nome}": ${e.response?.data?.message || e.message}` });
        }
      }

      // ---------- 4. PRODUTOS ----------
      const { data: existingProds } = await api.get(`/empresas/${empresaId}/produtos`);
      const prodMap = new Map<string, string>(
        (existingProds ?? []).map((p: any) => [p.nome.toLowerCase().trim(), p.id])
      );

      for (let i = 0; i < prodRows.length; i++) {
        const row = prodRows[i];
        const linha = i + 3;
        const nome = String(row.nome ?? "").trim();
        if (!nome) {
          errors.push({ aba: "Produtos", linha, coluna: "nome", mensagem: "Nome obrigatório" });
          continue;
        }
        if (prodMap.has(nome.toLowerCase())) {
          warnings.push({ aba: "Produtos", linha, mensagem: `Produto "${nome}" já existe, ignorado` });
          continue;
        }

        const possuiVariantes = parseBool(row.possui_variantes);
        const ativo = parseBool(row.ativo ?? "SIM");

        // Categoria: resolve ou cria auto
        const categoriaName = String(row.categoria ?? "").trim();
        let categoriaId: string | null = null;
        if (categoriaName) {
          const key = categoriaName.toLowerCase();
          categoriaId = catMap.get(key) ?? null;
          if (!categoriaId) {
            try {
              const { data: created } = await api.post(`/empresas/${empresaId}/categorias`, {
                empresa_id: empresaId, nome: categoriaName, ativo: true, ordem: 0,
              });
              categoriaId = created.id;
              catMap.set(key, created.id);
              counts.categorias++;
              warnings.push({ aba: "Produtos", linha, coluna: "categoria", valor: categoriaName, mensagem: `Categoria "${categoriaName}" criada automaticamente` });
            } catch (e: any) {
              errors.push({ aba: "Produtos", linha, coluna: "categoria", valor: categoriaName, mensagem: `Falha ao criar categoria: ${e.response?.data?.message || e.message}` });
            }
          }
        }

        const precoBase = possuiVariantes ? null : parseNum(row.preco_base, "Produtos", linha, "preco_base");
        const custoBase = possuiVariantes ? null : parseNum(row.custo_base, "Produtos", linha, "custo_base");

        let novoProdId: string;
        try {
          const { data: created } = await api.post(`/empresas/${empresaId}/produtos`, {
            empresa_id: empresaId,
            nome,
            descricao: row.descricao ? String(row.descricao) : null,
            categoria_id: categoriaId,
            possui_variantes: possuiVariantes,
            preco_base: precoBase,
            custo_base: custoBase,
            ativo,
            ordem: Number(row.ordem ?? 0),
          });
          novoProdId = created.id;
          prodMap.set(nome.toLowerCase(), novoProdId);
          counts.produtos++;
        } catch (e: any) {
          errors.push({ aba: "Produtos", linha, coluna: "nome", valor: nome, mensagem: `Falha ao criar produto: ${e.response?.data?.message || e.message}` });
          continue;
        }

        // Vincular grupos de adicionais (por nome, separados por ;)
        const gruposStr = String(row.grupos_adicionais ?? "").trim();
        if (gruposStr) {
          const nomes = gruposStr.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
          for (const gn of nomes) {
            const gid = grpMap.get(gn.toLowerCase());
            if (!gid) {
              errors.push({ aba: "Produtos", linha, coluna: "grupos_adicionais", valor: gn, mensagem: `Grupo "${gn}" não existe` });
              continue;
            }
            try {
              await api.post(`/empresas/${empresaId}/produto-adicionais-grupos`, {
                produto_id: novoProdId,
                grupo_id: gid,
              });
            } catch (e: any) {
              errors.push({ aba: "Produtos", linha, coluna: "grupos_adicionais", valor: gn, mensagem: `Falha ao vincular grupo: ${e.response?.data?.message || e.message}` });
            }
          }
        }

        // Ingredientes (por nome, separados por ;)
        const ingStr = String(row.ingredientes ?? "").trim();
        if (ingStr) {
          const nomes = ingStr.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
          for (let idx = 0; idx < nomes.length; idx++) {
            try {
              await api.post(`/empresas/${empresaId}/produto-ingredientes`, {
                produto_id: novoProdId,
                nome: nomes[idx],
                removivel: true,
                ordem: idx,
                ativo: true,
              });
              counts.ingredientes++;
            } catch (e: any) {
              errors.push({ aba: "Produtos", linha, coluna: "ingredientes", valor: nomes[idx], mensagem: `Falha ao criar ingrediente: ${e.response?.data?.message || e.message}` });
            }
          }
        }
      }

      // ---------- 5. VARIANTES ----------
      for (let i = 0; i < varRows.length; i++) {
        const row = varRows[i];
        const linha = i + 3;
        const prodNome = String(row.produto_nome ?? "").trim();
        const varNome = String(row.variante_nome ?? "").trim();
        if (!prodNome && !varNome) continue;
        if (!prodNome) {
          errors.push({ aba: "Variantes", linha, coluna: "produto_nome", mensagem: "Nome do produto obrigatório" });
          continue;
        }
        if (!varNome) {
          errors.push({ aba: "Variantes", linha, coluna: "variante_nome", mensagem: "Nome da variante obrigatório" });
          continue;
        }
        const prodId = prodMap.get(prodNome.toLowerCase());
        if (!prodId) {
          errors.push({ aba: "Variantes", linha, coluna: "produto_nome", valor: prodNome, mensagem: `Produto "${prodNome}" não encontrado na aba Produtos` });
          continue;
        }
        const preco = parseNum(row.preco_venda, "Variantes", linha, "preco_venda") ?? 0;
        const custo = parseNum(row.custo, "Variantes", linha, "custo") ?? 0;
        try {
          await api.post(`/empresas/${empresaId}/produto-variantes`, [{
            produto_id: prodId,
            empresa_id: empresaId,
            nome: varNome,
            preco_venda: preco,
            custo,
            sku: row.sku ? String(row.sku) : null,
            ativo: parseBool(row.ativo ?? "SIM"),
            ordem: Number(row.ordem ?? 0),
          }]);
          counts.variantes++;
        } catch (e: any) {
          errors.push({ aba: "Variantes", linha, mensagem: `Falha ao criar variante: ${e.response?.data?.message || e.message}` });
        }
      }

      qc.invalidateQueries({ queryKey: ["admin-produtos", empresaId] });
      qc.invalidateQueries({ queryKey: ["admin-categorias", empresaId] });
      qc.invalidateQueries({ queryKey: ["admin-adicionais-grupos", empresaId] });

      const total = counts.categorias + counts.grupos + counts.itens + counts.produtos + counts.variantes + counts.ingredientes;
      if (errors.length === 0 && warnings.length === 0) {
        toast.success(`Importação concluída: ${total} registro(s) criado(s).`);
        setImportDialogOpen(false);
      } else {
        setImportResult({ counts, errors, warnings });
        setImportDialogOpen(false);
      }
    } catch (err: any) {
      console.error("[Importação] Erro fatal:", err);
      const msg = err.response?.data?.message || err.message || "erro desconhecido";
      toast.error("Erro ao processar planilha: " + msg);
      setImportResult({
        counts,
        errors: [...errors, { aba: "(processamento)", linha: 0, mensagem: String(msg) }],
        warnings,
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-2xl font-bold">Produtos</h2>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => setImportDialogOpen(true)} disabled={importing}>
              <Upload className="h-4 w-4 mr-1" />{importing ? "Importando..." : "Importar"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
              }}
            />
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditItem(null); }}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{editItem ? "Editar" : "Novo"} Produto</DialogTitle></DialogHeader>
                <ProdutoForm
                initial={editItem}
                categorias={categorias ?? []}
                adicionaisGrupos={adicionaisGrupos ?? []}
                onSubmit={(v, f, g) => upsert.mutate({ values: v, imageFile: f, grupoIds: g })}
                loading={upsert.isPending}
              />
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Img</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Variantes</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(produtos as any[])?.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>
                    {p.imagem_url ? (
                      <img src={p.imagem_url} alt={p.nome} className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-secondary flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{p.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{p.categoria?.nome ?? "—"}</TableCell>
                  <TableCell>
                    {p.possui_variantes
                      ? `${p.variantes?.length ?? 0} var.`
                      : p.preco_base ? formatBRL(p.preco_base) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {p.possui_variantes && (
                        <Button variant="outline" size="sm" onClick={() => setVariantDialogProduct(p)}>
                          Gerenciar
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setIngredientDialogProduct(p)} title="Ingredientes">
                        <Salad className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch checked={p.ativo} onCheckedChange={(v) => toggleAtivo.mutate({ id: p.id, ativo: v })} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditItem(p); setDialogOpen(true); }} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => duplicar.mutate(p)} disabled={duplicar.isPending} title="Duplicar">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Variant management dialog */}
      {variantDialogProduct && (
        <VariantesDialog
          produto={variantDialogProduct}
          empresaId={empresaId}
          open={!!variantDialogProduct}
          onClose={() => { setVariantDialogProduct(null); qc.invalidateQueries({ queryKey: ["admin-produtos", empresaId] }); }}
        />
      )}

      {/* Ingredients management dialog */}
      {ingredientDialogProduct && (
        <IngredientesDialog
          produto={ingredientDialogProduct}
          empresaId={empresaId}
          open={!!ingredientDialogProduct}
          onClose={() => setIngredientDialogProduct(null)}
        />
      )}

      {/* Import dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Importar Cardápio Completo via Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Baixe o modelo, preencha as abas que desejar (todas opcionais exceto <b>Produtos</b>) e envie o arquivo. Referências faltantes (ex: categoria mencionada num produto mas não na aba Categorias) são criadas automaticamente.
            </p>
            <div className="rounded-lg border p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Abas do modelo:</p>
              <p>• <b>Categorias</b> — opcional</p>
              <p>• <b>GruposAdicionais</b> — opcional (ex: Borda, Extras)</p>
              <p>• <b>ItensAdicionais</b> — opcional (itens de cada grupo)</p>
              <p>• <b>Produtos</b> — obrigatória</p>
              <p>• <b>Variantes</b> — só se o produto tiver <code>possui_variantes = SIM</code></p>
            </div>
            <div className="rounded-lg border border-dashed p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                <span className="text-sm font-medium">Baixe o modelo</span>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-1" />Baixar planilha modelo
              </Button>
            </div>
            <div className="rounded-lg border border-dashed p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                <span className="text-sm font-medium">Envie a planilha preenchida</span>
              </div>
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                <Upload className="h-4 w-4 mr-1" />{importing ? "Importando..." : "Selecionar arquivo"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: .xlsx, .xls • Produtos/categorias/grupos já existentes (mesmo nome) são reaproveitados, não duplicados.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import result dialog (shows after import finishes with errors/warnings) */}
      <Dialog open={!!importResult} onOpenChange={(o) => !o && setImportResult(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Resultado da Importação</DialogTitle>
          </DialogHeader>
          {importResult && (
            <div className="space-y-4 overflow-y-auto">
              {/* Resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                <div className="rounded-lg border p-2"><span className="text-muted-foreground">Categorias:</span> <b>{importResult.counts.categorias}</b></div>
                <div className="rounded-lg border p-2"><span className="text-muted-foreground">Grupos:</span> <b>{importResult.counts.grupos}</b></div>
                <div className="rounded-lg border p-2"><span className="text-muted-foreground">Itens:</span> <b>{importResult.counts.itens}</b></div>
                <div className="rounded-lg border p-2"><span className="text-muted-foreground">Produtos:</span> <b>{importResult.counts.produtos}</b></div>
                <div className="rounded-lg border p-2"><span className="text-muted-foreground">Variantes:</span> <b>{importResult.counts.variantes}</b></div>
                <div className="rounded-lg border p-2"><span className="text-muted-foreground">Ingredientes:</span> <b>{importResult.counts.ingredientes}</b></div>
              </div>

              {/* Erros */}
              {importResult.errors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-red-600">
                    ❌ {importResult.errors.length} erro(s) — estes itens NÃO foram criados:
                  </h3>
                  <div className="rounded-lg border border-red-200 dark:border-red-900 divide-y text-xs max-h-64 overflow-y-auto">
                    {importResult.errors.map((e, idx) => (
                      <div key={idx} className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30">
                        <div className="font-mono text-red-700 dark:text-red-400">
                          Aba <b>{e.aba}</b> · Linha <b>{e.linha}</b>
                          {e.coluna && <> · Coluna <b>{e.coluna}</b></>}
                          {e.valor && <> · Valor: <code className="bg-red-100 dark:bg-red-900 px-1 rounded">{e.valor}</code></>}
                        </div>
                        <div className="mt-1">{e.mensagem}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Avisos */}
              {importResult.warnings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-yellow-600">
                    ⚠️ {importResult.warnings.length} aviso(s):
                  </h3>
                  <div className="rounded-lg border border-yellow-200 dark:border-yellow-900 divide-y text-xs max-h-40 overflow-y-auto">
                    {importResult.warnings.map((w, idx) => (
                      <div key={idx} className="p-2 hover:bg-yellow-50 dark:hover:bg-yellow-950/30">
                        <span className="font-mono text-yellow-700 dark:text-yellow-400">
                          Aba <b>{w.aba}</b> · Linha <b>{w.linha}</b>:
                        </span>{" "}
                        {w.mensagem}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button onClick={() => setImportResult(null)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function ProdutoForm({
  initial,
  categorias,
  adicionaisGrupos,
  onSubmit,
  loading,
}: {
  initial: Produto | null;
  categorias: { id: string; nome: string }[];
  adicionaisGrupos: { id: string; nome: string }[];
  onSubmit: (v: ProdutoInsert & { id?: string }, file?: File, grupoIds?: string[]) => void;
  loading: boolean;
}) {
  const { empresaId } = useEmpresa();
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [categoriaId, setCategoriaId] = useState(initial?.categoria_id ?? "");
  const [possuiVariantes, setPossuiVariantes] = useState(initial?.possui_variantes ?? false);
  const [precoBase, setPrecoBase] = useState(initial?.preco_base?.toString() ?? "");
  const [custoBase, setCustoBase] = useState(initial?.custo_base?.toString() ?? "");
  const [ordem, setOrdem] = useState(initial?.ordem ?? 0);
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [selectedGrupos, setSelectedGrupos] = useState<string[]>([]);

  useState(() => {
    if (initial?.adicionais_grupos?.length) {
      setSelectedGrupos(initial.adicionais_grupos.map((ag: any) => ag.grupo_id));
    }
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(
          {
            ...(initial ? { id: initial.id } : {}),
            nome,
            descricao: descricao || null,
            categoria_id: categoriaId || null,
            possui_variantes: possuiVariantes,
            preco_base: possuiVariantes ? null : precoBase ? Number(precoBase) : null,
            custo_base: possuiVariantes ? null : custoBase ? Number(custoBase) : null,
            ordem,
            imagem_url: initial?.imagem_url ?? null,
          } as any,
          imageFile,
          selectedGrupos
        );
      }}
    >
      <div className="space-y-1">
        <Label>Nome *</Label>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label>Descrição</Label>
        <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} />
      </div>
      <div className="space-y-1">
        <Label>Categoria</Label>
        <Select value={categoriaId ?? ""} onValueChange={setCategoriaId}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Imagem</Label>
        <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0])} />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={possuiVariantes} onCheckedChange={setPossuiVariantes} />
        <Label>Possui variantes (tamanhos/sabores)</Label>
      </div>
      {!possuiVariantes && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label>Custo (R$)</Label>
            <Input type="number" step="0.01" value={custoBase} onChange={(e) => setCustoBase(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Preço (R$)</Label>
            <Input type="number" step="0.01" value={precoBase} onChange={(e) => setPrecoBase(e.target.value)} />
          </div>
        </div>
      )}
      <div className="space-y-1">
        <Label>Ordem</Label>
        <Input type="number" value={ordem} onChange={(e) => setOrdem(Number(e.target.value))} />
      </div>
      {adicionaisGrupos.length > 0 && (
        <div className="space-y-2">
          <Label>Grupos de adicionais</Label>
          {adicionaisGrupos.map((g) => (
            <div key={g.id} className="flex items-center gap-2">
              <Checkbox
                checked={selectedGrupos.includes(g.id)}
                onCheckedChange={(checked) => {
                  setSelectedGrupos((prev) =>
                    checked ? [...prev, g.id] : prev.filter((id) => id !== g.id)
                  );
                }}
              />
              <span className="text-sm">{g.nome}</span>
            </div>
          ))}
        </div>
      )}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}

function VariantesDialog({
  produto,
  empresaId,
  open,
  onClose,
}: {
  produto: Produto;
  empresaId: string;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editVar, setEditVar] = useState<ProdutoVariante | null>(null);

  const { data: variantes } = useQuery({
    queryKey: ["admin-variantes", produto.id],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/produto-variantes`);
      return (data ?? []).filter((v: any) => (v.produto_id ?? v.produtoId) === produto.id);
    },
  });

  const upsert = useMutation({
    mutationFn: async (values: any) => {
      if (values.id) {
        await api.patch(`/empresas/${empresaId}/produto-variantes/${values.id}`, values);
      } else {
        await api.post(`/empresas/${empresaId}/produto-variantes`, { ...values, produto_id: produto.id, empresa_id: empresaId });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-variantes", produto.id] });
      setFormOpen(false);
      setEditVar(null);
      toast.success("Variante salva!");
    },
  });

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      await api.patch(`/empresas/${empresaId}/produto-variantes/${id}`, { ativo });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-variantes", produto.id] }),
  });

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Variantes — {produto.nome}</DialogTitle>
        </DialogHeader>
        <Button size="sm" onClick={() => { setEditVar(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" />Nova Variante
        </Button>

        {formOpen && (
          <VarianteForm
            key={editVar?.id ?? "new"}
            initial={editVar}
            onSubmit={(v) => upsert.mutate(v)}
            loading={upsert.isPending}
            onCancel={() => { setFormOpen(false); setEditVar(null); }}
          />
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Custo</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variantes?.map((v) => (
              <TableRow key={v.id}>
                <TableCell>{v.nome}</TableCell>
                <TableCell>{formatBRL(v.custo)}</TableCell>
                <TableCell>{formatBRL(v.preco_venda)}</TableCell>
                <TableCell>
                  <Switch checked={v.ativo} onCheckedChange={(val) => toggleAtivo.mutate({ id: v.id, ativo: val })} />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => { setEditVar(v); setFormOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}

function VarianteForm({
  initial,
  onSubmit,
  loading,
  onCancel,
}: {
  initial: ProdutoVariante | null;
  onSubmit: (v: any) => void;
  loading: boolean;
  onCancel: () => void;
}) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [custo, setCusto] = useState(initial?.custo?.toString() ?? "0");
  const [preco, setPreco] = useState(initial?.preco_venda?.toString() ?? "0");
  const [ordem, setOrdem] = useState(initial?.ordem ?? 0);

  return (
    <form
      className="space-y-3 p-3 border rounded-lg"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          ...(initial ? { id: initial.id } : {}),
          nome,
          sku: sku || null,
          custo: Number(custo),
          preco_venda: Number(preco),
          ordem,
        });
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>Nome *</Label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex: P, M, G" />
        </div>
        <div className="space-y-1">
          <Label>SKU</Label>
          <Input value={sku} onChange={(e) => setSku(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label>Custo (R$)</Label>
          <Input type="number" step="0.01" value={custo} onChange={(e) => setCusto(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Preço (R$)</Label>
          <Input type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Ordem</Label>
          <Input type="number" value={ordem} onChange={(e) => setOrdem(Number(e.target.value))} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading} className="flex-1">{loading ? "Salvando..." : "Salvar"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

function IngredientesDialog({
  produto,
  empresaId,
  open,
  onClose,
}: {
  produto: Produto;
  empresaId: string;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const [removivel, setRemovivel] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: ingredientes } = useQuery({
    queryKey: ["admin-ingredientes", produto.id],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/produto-ingredientes`);
      return (data ?? []).filter((ing: any) => (ing.produto_id ?? ing.produtoId) === produto.id);
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      if (editId) {
        await api.patch(`/empresas/${empresaId}/produto-ingredientes/${editId}`, { nome, removivel });
      } else {
        await api.post(`/empresas/${empresaId}/produto-ingredientes`, {
          produto_id: produto.id,
          empresa_id: empresaId,
          nome,
          removivel,
          ordem: (ingredientes?.length ?? 0),
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ingredientes", produto.id] });
      setNome("");
      setRemovivel(true);
      setEditId(null);
      toast.success("Ingrediente salvo!");
    },
    onError: () => toast.error("Erro ao salvar ingrediente."),
  });

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      await api.patch(`/empresas/${empresaId}/produto-ingredientes/${id}`, { ativo });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ingredientes", produto.id] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/empresas/${empresaId}/produto-ingredientes/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ingredientes", produto.id] });
      toast.success("Ingrediente removido!");
    },
  });

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Ingredientes — {produto.nome}</DialogTitle>
        </DialogHeader>

        <form
          className="flex gap-2 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (!nome.trim()) return;
            upsert.mutate();
          }}
        >
          <div className="flex-1 space-y-1">
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Queijo, Cebola" required />
          </div>
          <div className="flex items-center gap-1 pb-1">
            <Checkbox checked={removivel} onCheckedChange={(v) => setRemovivel(!!v)} />
            <span className="text-xs whitespace-nowrap">Removível</span>
          </div>
          <Button type="submit" size="sm" disabled={upsert.isPending}>
            {editId ? "Salvar" : <Plus className="h-4 w-4" />}
          </Button>
          {editId && (
            <Button type="button" size="sm" variant="outline" onClick={() => { setEditId(null); setNome(""); setRemovivel(true); }}>
              Cancelar
            </Button>
          )}
        </form>

        <div className="flex-1 overflow-y-auto min-h-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Removível</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredientes?.map((ing) => (
                <TableRow key={ing.id}>
                  <TableCell className="font-medium">{ing.nome}</TableCell>
                  <TableCell>{ing.removivel ? "Sim" : "Não"}</TableCell>
                  <TableCell>
                    <Switch checked={ing.ativo} onCheckedChange={(v) => toggleAtivo.mutate({ id: ing.id, ativo: v })} />
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditId(ing.id); setNome(ing.nome); setRemovivel(ing.removivel); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!ingredientes?.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum ingrediente cadastrado</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="pt-2 border-t">
          <Button variant="outline" className="w-full" onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
