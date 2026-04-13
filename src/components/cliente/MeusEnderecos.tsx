import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { toast } from "sonner";

const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cliente-auth`;

interface Endereco {
  id?: string;
  apelido: string;
  rua: string;
  numero: string;
  bairro: string;
  complemento?: string;
  referencia?: string;
  padrao: boolean;
}

export default function MeusEnderecos({ clienteId }: { clienteId: string }) {
  const { empresaId } = useEmpresa();
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEndereco, setEditEndereco] = useState<Endereco | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/meus-enderecos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, empresa_id: empresaId, action: "listar" }),
      });
      const data = await res.json();
      setEnderecos(data.enderecos || []);
    } catch {
      toast.error("Erro ao carregar endereços");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [clienteId, empresaId]);

  const handleSave = async (end: Endereco) => {
    try {
      const res = await fetch(`${BASE_URL}/meus-enderecos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, empresa_id: empresaId, action: "salvar", endereco: end }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao salvar");
        return;
      }
      toast.success("Endereço salvo!");
      setDialogOpen(false);
      setEditEndereco(null);
      load();
    } catch {
      toast.error("Erro de conexão");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${BASE_URL}/meus-enderecos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, empresa_id: empresaId, action: "excluir", endereco: { id } }),
      });
      toast.success("Endereço removido");
      load();
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  const openNew = () => {
    setEditEndereco({ apelido: "Casa", rua: "", numero: "", bairro: "", padrao: false });
    setDialogOpen(true);
  };

  const openEdit = (e: Endereco) => {
    setEditEndereco({ ...e });
    setDialogOpen(true);
  };

  if (loading) return <p className="text-center text-muted-foreground py-8">Carregando...</p>;

  return (
    <div className="space-y-3">
      <Button onClick={openNew} size="sm" className="gap-1.5">
        <Plus className="h-4 w-4" /> Novo endereço
      </Button>

      {enderecos.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Nenhum endereço cadastrado.</p>
      )}

      {enderecos.map((e) => (
        <Card key={e.id}>
          <CardContent className="p-4 flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{e.apelido}</span>
                {e.padrao && <Badge variant="secondary" className="text-xs">Padrão</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                {e.rua}, {e.numero} — {e.bairro}
                {e.complemento && ` (${e.complemento})`}
              </p>
              {e.referencia && <p className="text-xs text-muted-foreground">{e.referencia}</p>}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(e)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => e.id && handleDelete(e.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <EnderecoDialog
        open={dialogOpen}
        endereco={editEndereco}
        onClose={() => { setDialogOpen(false); setEditEndereco(null); }}
        onSave={handleSave}
      />
    </div>
  );
}

function EnderecoDialog({ open, endereco, onClose, onSave }: {
  open: boolean;
  endereco: Endereco | null;
  onClose: () => void;
  onSave: (e: Endereco) => void;
}) {
  const [form, setForm] = useState<Endereco>(endereco || { apelido: "Casa", rua: "", numero: "", bairro: "", padrao: false });

  useEffect(() => {
    if (endereco) setForm(endereco);
  }, [endereco]);

  const update = (field: string, value: string | boolean) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{form.id ? "Editar endereço" : "Novo endereço"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label>Apelido</Label>
            <Input value={form.apelido} onChange={(e) => update("apelido", e.target.value)} placeholder="Ex: Casa, Trabalho" maxLength={50} />
          </div>
          <div className="space-y-1">
            <Label>Rua</Label>
            <Input value={form.rua} onChange={(e) => update("rua", e.target.value)} maxLength={200} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Número</Label>
              <Input value={form.numero} onChange={(e) => update("numero", e.target.value)} maxLength={20} />
            </div>
            <div className="space-y-1">
              <Label>Bairro</Label>
              <Input value={form.bairro} onChange={(e) => update("bairro", e.target.value)} maxLength={100} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Complemento</Label>
            <Input value={form.complemento || ""} onChange={(e) => update("complemento", e.target.value)} placeholder="Apto, Bloco..." maxLength={100} />
          </div>
          <div className="space-y-1">
            <Label>Referência</Label>
            <Input value={form.referencia || ""} onChange={(e) => update("referencia", e.target.value)} placeholder="Próximo ao..." maxLength={200} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.padrao} onCheckedChange={(v) => update("padrao", v)} />
            <Label>Endereço padrão</Label>
          </div>
          <Button className="w-full" onClick={() => onSave(form)} disabled={!form.rua || !form.numero || !form.bairro}>
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
