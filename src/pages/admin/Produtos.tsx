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

export default function Produtos() {
  const { empresaId } = useEmpresa();
  const qc = useQueryClient();
  const [editItem, setEditItem] = useState<Produto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [variantDialogProduct, setVariantDialogProduct] = useState<Produto | null>(null);
  const [ingredientDialogProduct, setIngredientDialogProduct] = useState<Produto | null>(null);
  const [importing, setImporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
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

      const payload = { ...values, imagem_url, empresa_id: empresaId };

      let produtoId: string;
      if (values.id) {
        await api.patch(`/empresas/${empresaId}/produtos/${values.id}`, payload);
        produtoId = values.id;
      } else {
        const { data } = await api.post(`/empresas/${empresaId}/produtos`, payload);
        produtoId = data.id;
      }

      // Sync adicionais groups
      await api.delete(`/empresas/${empresaId}/produto-adicionais-grupos`);
      if (grupoIds.length > 0) {
        await api.post(`/empresas/${empresaId}/produto-adicionais-grupos`, grupoIds.map((grupo_id) => ({ produto_id: produtoId, grupo_id, empresa_id: empresaId }))
        );
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
      const { id, created_at, categorias: _cat, produto_variantes: _vars, ...rest } = produto;
      const { data: novo } = await api.post(`/empresas/${empresaId}/produtos`, { ...rest, nome: `${rest.nome} (Cópia)`, empresa_id: empresaId });
      const novoId = novo.id;

      // 2. Copy variants
      if (produto.produto_variantes?.length) {
        const variants = produto.produto_variantes.map((v: any) => ({
          produto_id: novoId,
          empresa_id: empresaId,
          nome: v.nome,
          sku: v.sku,
          custo: v.custo,
          preco_venda: v.preco_venda,
          ordem: v.ordem,
          ativo: v.ativo,
        }));
        await api.post(`/empresas/${empresaId}/produto-variantes`, variants);
      }

      // 3. Copy addons groups
      const { data: grupos } = await api.get(`/empresas/${empresaId}/produto-adicionais-grupos`);
      if (grupos?.length) {
        await api.post(`/empresas/${empresaId}/produto-adicionais-grupos`, grupos.map((g: any) => ({ produto_id: novoId, grupo_id: g.grupo_id, empresa_id: empresaId }))
        );
      }

      // 4. Copy ingredients
      const { data: ings } = await api.get(`/empresas/${empresaId}/produto-ingredientes`);
      if (ings?.length) {
        await api.post(`/empresas/${empresaId}/produto-ingredientes`, ings.map((i: any) => ({
            produto_id: novoId,
            empresa_id: empresaId,
            nome: i.nome,
            removivel: i.removivel,
            ordem: i.ordem,
            ativo: i.ativo,
          }))
        );
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

    const prodData = [
      ["nome", "descricao", "categoria", "preco_base", "custo_base", "possui_variantes", "ativo", "ordem"],
      ["Nome do produto (obrigatório)", "Descrição (opcional)", "Nome da categoria", "Preço de venda", "Custo", "SIM ou NÃO", "SIM ou NÃO", "Número"],
      ["X-Burguer", "Hambúrguer artesanal", "Lanches", 25.90, 12.00, "NÃO", "SIM", 1],
      ["Pizza", "Pizza artesanal", "Pizzas", null, null, "SIM", "SIM", 2],
    ];
    const wsProd = XLSX.utils.aoa_to_sheet(prodData);
    wsProd["!cols"] = [{ wch: 25 }, { wch: 30 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 10 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsProd, "Produtos");

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

    XLSX.writeFile(wb, "modelo_importacao_produtos.xlsx");
  };

  const handleImportFile = async (file: File) => {
    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);

      // Parse products sheet (skip header + description row)
      const prodSheet = wb.Sheets["Produtos"] || wb.Sheets[wb.SheetNames[0]];
      const prodRows: any[] = XLSX.utils.sheet_to_json(prodSheet, { range: 1 });

      if (!prodRows.length) {
        toast.error("Planilha vazia ou sem dados na aba 'Produtos'.");
        return;
      }

      // Parse variants sheet
      let varRows: any[] = [];
      const varSheet = wb.Sheets["Variantes"] || wb.Sheets[wb.SheetNames[1]];
      if (varSheet) {
        varRows = XLSX.utils.sheet_to_json(varSheet, { range: 1 });
      }

      // Match categories by name
      const { data: cats } = await api.get(`/empresas/${empresaId}/categorias`);
      const catMap = new Map((cats ?? []).map((c) => [c.nome.toLowerCase().trim(), c.id]));

      let imported = 0;
      let errors: string[] = [];

      for (const row of prodRows) {
        const nome = String(row.nome ?? "").trim();
        if (!nome) { errors.push("Linha sem nome ignorada"); continue; }

        const possuiVariantes = parseBool(row.possui_variantes);
        const ativo = parseBool(row.ativo ?? "SIM");
        const categoriaName = String(row.categoria ?? "").trim().toLowerCase();
        const categoriaId = catMap.get(categoriaName) || null;

        if (categoriaName && !categoriaId) {
          errors.push(`Categoria "${row.categoria}" não encontrada para "${nome}"`);
        }

        const precoStr = String(row.preco_base ?? "").replace(",", ".");
        const custoStr = String(row.custo_base ?? "").replace(",", ".");

        let novoProd: any;
        try {
          const { data } = await api.post(`/empresas/${empresaId}/produtos`, {
            empresa_id: empresaId,
            nome,
            descricao: row.descricao ? String(row.descricao) : null,
            categoria_id: categoriaId,
            possui_variantes: possuiVariantes,
            preco_base: possuiVariantes ? null : precoStr ? Number(precoStr) : null,
            custo_base: possuiVariantes ? null : custoStr ? Number(custoStr) : null,
            ativo,
            ordem: Number(row.ordem ?? 0),
          });
          novoProd = data;
        } catch (insertErr: any) {
          errors.push(`Erro ao inserir "${nome}": ${insertErr.message}`);
          continue;
        }

        // Insert variants for this product
        if (possuiVariantes && novoProd) {
          const prodVariants = varRows.filter(
            (v) => String(v.produto_nome ?? "").trim().toLowerCase() === nome.toLowerCase()
          );
          if (prodVariants.length) {
            const varInserts = prodVariants.map((v) => ({
              produto_id: novoProd.id,
              empresa_id: empresaId,
              nome: String(v.variante_nome ?? "").trim(),
              preco_venda: Number(String(v.preco_venda ?? "0").replace(",", ".")),
              custo: Number(String(v.custo ?? "0").replace(",", ".")),
              sku: v.sku ? String(v.sku) : null,
              ativo: parseBool(v.ativo ?? "SIM"),
              ordem: Number(v.ordem ?? 0),
            }));
            try {
              await api.post(`/empresas/${empresaId}/produto-variantes`, varInserts);
            } catch (varErr: any) {
              errors.push(`Erro ao inserir variantes de "${nome}": ${varErr.message}`);
            }
          }
        }

        imported++;
      }

      qc.invalidateQueries({ queryKey: ["admin-produtos", empresaId] });

      if (errors.length) {
        toast.warning(`${imported} produto(s) importado(s) com ${errors.length} aviso(s).`);
        console.warn("Erros de importação:", errors);
      } else {
        toast.success(`${imported} produto(s) importado(s) com sucesso!`);
      }
      setImportDialogOpen(false);
    } catch (err: any) {
      toast.error("Erro ao processar planilha: " + (err.message || "erro desconhecido"));
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
                  <TableCell className="text-muted-foreground">{p.categorias?.nome ?? "—"}</TableCell>
                  <TableCell>
                    {p.possui_variantes
                      ? `${p.produto_variantes?.length ?? 0} var.`
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Produtos via Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Importe seus produtos em massa a partir de uma planilha Excel. 
              Baixe o modelo abaixo, preencha com seus dados e envie o arquivo.
            </p>
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
              Formatos aceitos: .xlsx, .xls • As categorias devem estar cadastradas antes da importação.
            </p>
          </div>
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

  useQuery({
    queryKey: ["produto-grupos", initial?.id],
    queryFn: async () => {
      if (!initial?.id) return [];
      const { data } = await api.get(`/empresas/${empresaId}/produto-adicionais-grupos`);
      const ids = (data ?? []).map((d) => d.grupo_id);
      setSelectedGrupos(ids);
      return ids;
    },
    enabled: !!initial?.id,
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
      return data;
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
      return data;
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
