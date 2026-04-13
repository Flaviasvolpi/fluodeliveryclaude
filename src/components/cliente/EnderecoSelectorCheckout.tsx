import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Plus, Check, ChevronDown, ChevronUp, Save } from "lucide-react";
import { toast } from "sonner";

const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cliente-auth`;

interface Endereco {
  id?: string;
  apelido: string;
  rua: string;
  numero: string;
  bairro: string;
  complemento: string;
  referencia: string;
  padrao: boolean;
}

interface EnderecoForm {
  rua: string;
  numero: string;
  bairro: string;
  complemento: string;
  referencia: string;
}

interface Props {
  clienteId: string;
  empresaId: string;
  endereco: EnderecoForm;
  onEnderecoChange: (e: EnderecoForm) => void;
}

export default function EnderecoSelectorCheckout({ clienteId, empresaId, endereco, onEnderecoChange }: Props) {
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newApelido, setNewApelido] = useState("Casa");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEnderecos();
  }, [clienteId, empresaId]);

  const loadEnderecos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/meus-enderecos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, empresa_id: empresaId, action: "listar" }),
      });
      const data = await res.json();
      const list: Endereco[] = data.enderecos || [];
      setEnderecos(list);

      // Find which saved address matches current form
      const match = list.find(
        (e) => e.rua === endereco.rua && e.numero === endereco.numero && e.bairro === endereco.bairro
      );
      if (match?.id) setSelectedId(match.id);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const selectEndereco = (e: Endereco) => {
    setSelectedId(e.id || null);
    onEnderecoChange({
      rua: e.rua,
      numero: e.numero,
      bairro: e.bairro,
      complemento: e.complemento || "",
      referencia: e.referencia || "",
    });
    setExpanded(false);
    setShowNewForm(false);
  };

  const handleNewAddress = () => {
    setSelectedId(null);
    setShowNewForm(true);
    setExpanded(true);
    onEnderecoChange({ rua: "", numero: "", bairro: "", complemento: "", referencia: "" });
  };

  const saveNewAddress = async () => {
    if (!endereco.rua || !endereco.numero || !endereco.bairro) {
      toast.error("Preencha rua, número e bairro");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/meus-enderecos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: clienteId,
          empresa_id: empresaId,
          action: "salvar",
          endereco: {
            apelido: newApelido || "Casa",
            rua: endereco.rua,
            numero: endereco.numero,
            bairro: endereco.bairro,
            complemento: endereco.complemento,
            referencia: endereco.referencia,
            padrao: enderecos.length === 0,
          },
        }),
      });
      if (res.ok) {
        toast.success("Endereço salvo!");
        setShowNewForm(false);
        await loadEnderecos();
      }
    } catch {
      toast.error("Erro ao salvar endereço");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;
  if (enderecos.length === 0 && !showNewForm) return null;

  const selected = enderecos.find((e) => e.id === selectedId);

  return (
    <div className="space-y-2">
      {/* Current selected address summary */}
      {selected && !expanded && (
        <button
          type="button"
          className="w-full flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5 text-left"
          onClick={() => setExpanded(true)}
        >
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selected.apelido}: {selected.rua}, {selected.numero}</p>
            <p className="text-xs text-muted-foreground truncate">{selected.bairro}{selected.complemento ? ` · ${selected.complemento}` : ""}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      )}

      {/* Address list */}
      {expanded && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Seus endereços</p>
            <button type="button" className="text-xs text-muted-foreground" onClick={() => setExpanded(false)}>
              <ChevronUp className="h-4 w-4 inline" /> Fechar
            </button>
          </div>
          {enderecos.map((e) => (
            <button
              key={e.id}
              type="button"
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                selectedId === e.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
              }`}
              onClick={() => selectEndereco(e)}
            >
              {selectedId === e.id ? (
                <Check className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{e.apelido}: {e.rua}, {e.numero}</p>
                <p className="text-xs text-muted-foreground truncate">{e.bairro}{e.complemento ? ` · ${e.complemento}` : ""}</p>
              </div>
              {e.padrao && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">Padrão</span>}
            </button>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-1.5"
            onClick={handleNewAddress}
          >
            <Plus className="h-3.5 w-3.5" /> Novo endereço
          </Button>
        </div>
      )}

      {/* Inline new address form */}
      {showNewForm && (
        <Card className="border-dashed">
          <CardContent className="p-3 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Apelido (ex: Casa, Trabalho)</Label>
              <Input
                value={newApelido}
                onChange={(e) => setNewApelido(e.target.value)}
                placeholder="Casa"
                className="h-8 text-sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Rua *</Label>
                <Input className="h-8 text-sm" value={endereco.rua} onChange={(e) => onEnderecoChange({ ...endereco, rua: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nº *</Label>
                <Input className="h-8 text-sm" value={endereco.numero} onChange={(e) => onEnderecoChange({ ...endereco, numero: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bairro *</Label>
              <Input className="h-8 text-sm" value={endereco.bairro} onChange={(e) => onEnderecoChange({ ...endereco, bairro: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Complemento</Label>
              <Input className="h-8 text-sm" value={endereco.complemento} onChange={(e) => onEnderecoChange({ ...endereco, complemento: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Referência</Label>
              <Input className="h-8 text-sm" value={endereco.referencia} onChange={(e) => onEnderecoChange({ ...endereco, referencia: e.target.value })} />
            </div>
            <Button
              type="button"
              size="sm"
              className="w-full gap-1.5"
              disabled={saving || !endereco.rua || !endereco.numero || !endereco.bairro}
              onClick={saveNewAddress}
            >
              <Save className="h-3.5 w-3.5" /> {saving ? "Salvando..." : "Salvar e usar este endereço"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* If not expanded and no saved address selected, show button to pick */}
      {!selected && !expanded && enderecos.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-1.5"
          onClick={() => setExpanded(true)}
        >
          <MapPin className="h-3.5 w-3.5" /> Escolher endereço salvo
        </Button>
      )}
    </div>
  );
}
