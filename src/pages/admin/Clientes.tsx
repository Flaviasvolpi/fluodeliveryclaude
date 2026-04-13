import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useEmpresa } from "@/contexts/EmpresaContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBRL, formatDate } from "@/lib/format";
import { Search, Users, ArrowLeft, Phone, ShoppingBag, TrendingUp, Settings2, Crown, UserCheck, UserMinus, UserX, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  useClassificacaoConfig,
  classificarCliente,
  CLASSIFICACAO_LABELS,
  CLASSIFICACAO_COLORS,
  type Classificacao,
  type ClassificacaoConfig,
} from "@/hooks/useClienteClassificacao";
import ClienteClassificacaoConfig from "@/components/admin/ClienteClassificacaoConfig";
import ClienteDetalhe from "@/components/admin/ClienteDetalhe";

type ClienteRow = {
  id: string;
  nome: string;
  telefone: string;
  created_at: string;
  updated_at: string;
  total_pedidos: number;
  total_gasto: number;
  ultimo_pedido: string | null;
};

function ClassificacaoBadge({ classificacao }: { classificacao: Classificacao }) {
  return (
    <Badge variant="outline" className={`text-xs ${CLASSIFICACAO_COLORS[classificacao]}`}>
      {CLASSIFICACAO_LABELS[classificacao]}
    </Badge>
  );
}

export default function Clientes() {
  const { empresaId } = useEmpresa();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [filtroClassificacao, setFiltroClassificacao] = useState<Classificacao | "todos">("todos");
  const [showConfig, setShowConfig] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { config, isLoading: configLoading } = useClassificacaoConfig();

  const { data: clientes, isLoading } = useQuery({
    queryKey: ["admin-clientes", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/clientes`);
      const clienteIds = data.map((c) => c.id);
      if (clienteIds.length === 0) return [] as ClienteRow[];

      const { data: pedidos } = await api.get(`/empresas/${empresaId}/pedidos`);
      const metricsMap = new Map<string, { count: number; total: number; ultimo: string | null }>();
      for (const p of pedidos ?? []) {
        if (!p.cliente_id) continue;
        const m = metricsMap.get(p.cliente_id) ?? { count: 0, total: 0, ultimo: null };
        m.count++;
        m.total += p.total;
        if (!m.ultimo || p.created_at > m.ultimo) m.ultimo = p.created_at;
        metricsMap.set(p.cliente_id, m);
      }

      return data.map((c) => {
        const m = metricsMap.get(c.id);
        return {
          ...c,
          total_pedidos: m?.count ?? 0,
          total_gasto: m?.total ?? 0,
          ultimo_pedido: m?.ultimo ?? null,
        } as ClienteRow;
      });
    },
  });

  // Classify all clients
  const clientesComClassificacao = clientes?.map((c) => ({
    ...c,
    classificacao: classificarCliente(config, c.total_pedidos, c.total_gasto, c.ultimo_pedido),
  }));

  // Counts per classification
  const counts = { vip: 0, frequente: 0, ocasional: 0, perdido: 0 };
  clientesComClassificacao?.forEach((c) => counts[c.classificacao]++);

  // Filter
  const filtered = clientesComClassificacao?.filter((c) => {
    if (filtroClassificacao !== "todos" && c.classificacao !== filtroClassificacao) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return c.nome.toLowerCase().includes(q) || c.telefone.includes(q);
  });

  const selectedCliente = clientesComClassificacao?.find((c) => c.id === selectedClienteId);

  if (selectedClienteId && selectedCliente) {
    return (
      <AdminLayout>
        <ClienteDetalhe
          cliente={selectedCliente}
          classificacao={selectedCliente.classificacao}
          onBack={() => setSelectedClienteId(null)}
        />
      </AdminLayout>
    );
  }

  if (showConfig) {
    return (
      <AdminLayout>
        <ClienteClassificacaoConfig onBack={() => setShowConfig(false)} />
      </AdminLayout>
    );
  }

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const data = [
      ["nome", "telefone"],
      ["Nome do cliente (obrigatório)", "Telefone (obrigatório, chave única)"],
      ["João Silva", "(11) 99999-0001"],
      ["Maria Souza", "(11) 99999-0002"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!cols"] = [{ wch: 30 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");
    XLSX.writeFile(wb, "modelo_importacao_clientes.xlsx");
  };

  const handleImportFile = async (file: File) => {
    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const sheet = wb.Sheets["Clientes"] || wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { range: 1 });

      if (!rows.length) {
        toast.error("Planilha vazia ou sem dados.");
        return;
      }

      let imported = 0;
      let errors: string[] = [];

      for (const row of rows) {
        const nome = String(row.nome ?? "").trim();
        const telefone = String(row.telefone ?? "").trim();
        if (!nome || !telefone) { errors.push("Linha sem nome ou telefone ignorada"); continue; }

        try {
          await api.put(`/empresas/${empresaId}/clientes`, { empresa_id: empresaId, telefone, nome });
          imported++;
        } catch (insertErr: any) {
          errors.push(`Erro ao inserir "${nome}": ${insertErr.message}`);
          continue;
        }
      }

      qc.invalidateQueries({ queryKey: ["admin-clientes", empresaId] });

      if (errors.length) {
        toast.warning(`${imported} cliente(s) importado(s) com ${errors.length} aviso(s).`);
        console.warn("Erros de importação:", errors);
      } else {
        toast.success(`${imported} cliente(s) importado(s) com sucesso!`);
      }
      setImportDialogOpen(false);
    } catch (err: any) {
      toast.error("Erro ao processar planilha: " + (err.message || "erro desconhecido"));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const FILTER_ITEMS: { key: Classificacao | "todos"; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "todos", label: "Todos", icon: <Users className="h-4 w-4" />, count: clientes?.length ?? 0 },
    { key: "vip", label: "VIP", icon: <Crown className="h-4 w-4" />, count: counts.vip },
    { key: "frequente", label: "Frequente", icon: <UserCheck className="h-4 w-4" />, count: counts.frequente },
    { key: "ocasional", label: "Ocasional", icon: <UserMinus className="h-4 w-4" />, count: counts.ocasional },
    { key: "perdido", label: "Perdido", icon: <UserX className="h-4 w-4" />, count: counts.perdido },
  ];

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Clientes</h2>
            {clientes && <Badge variant="secondary">{clientes.length}</Badge>}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)} disabled={importing}>
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
            <Button variant="outline" size="sm" onClick={() => setShowConfig(true)}>
              <Settings2 className="h-4 w-4 mr-1" /> Configurar Classificação
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {FILTER_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setFiltroClassificacao(item.key)}
              className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-colors ${
                filtroClassificacao === item.key
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {item.icon}
              <div>
                <p className="text-lg font-bold leading-none">{item.count}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading || configLoading ? (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        ) : !filtered?.length ? (
          <p className="text-muted-foreground text-sm">Nenhum cliente encontrado.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <Card
                key={c.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedClienteId(c.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{c.nome}</p>
                      <p className="text-sm text-muted-foreground">{c.telefone}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                      <ClassificacaoBadge classificacao={c.classificacao} />
                      <Badge variant="secondary" className="text-xs">
                        {c.total_pedidos} {c.total_pedidos === 1 ? "pedido" : "pedidos"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <span>Total: <span className="text-foreground font-medium">{formatBRL(c.total_gasto)}</span></span>
                    {c.ultimo_pedido && <span>Último: {formatDate(c.ultimo_pedido)}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Import dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Clientes via Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Importe seus clientes em massa a partir de uma planilha Excel.
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
              Formatos aceitos: .xlsx, .xls • Clientes com telefone já existente serão atualizados.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
