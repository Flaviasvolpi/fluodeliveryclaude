import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useEmpresa } from "@/contexts/EmpresaContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, QrCode, Trash2, Pencil, Download, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useRef } from "react";

interface Mesa {
  id: string;
  empresa_id: string;
  numero: number;
  nome: string;
  ativo: boolean;
  qr_code_token: string;
  created_at: string;
}

export default function Mesas() {
  const { empresaId, slug } = useEmpresa();
  const qc = useQueryClient();
  const [editMesa, setEditMesa] = useState<Mesa | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formNumero, setFormNumero] = useState("");
  const [formNome, setFormNome] = useState("");
  const [qrMesa, setQrMesa] = useState<Mesa | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: mesas, isLoading } = useQuery({
    queryKey: ["admin-mesas", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/mesas`);
      return data as Mesa[];
    },
  });

  const upsertMesa = useMutation({
    mutationFn: async () => {
      const numero = parseInt(formNumero);
      if (!numero || !formNome.trim()) throw new Error("Preencha todos os campos");

      if (editMesa) {
        await api.patch(`/empresas/${empresaId}/mesas/${editMesa.id}`, { numero, nome: formNome.trim() });
      } else {
        await api.post(`/empresas/${empresaId}/mesas`, { empresa_id: empresaId, numero, nome: formNome.trim() });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-mesas", empresaId] });
      toast.success(editMesa ? "Mesa atualizada!" : "Mesa criada!");
      closeForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao salvar mesa");
    },
  });

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      await api.patch(`/empresas/${empresaId}/mesas/${id}`, { ativo });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-mesas", empresaId] });
    },
  });

  const deleteMesa = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/empresas/${empresaId}/mesas/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-mesas", empresaId] });
      toast.success("Mesa removida!");
    },
  });

  function openCreate() {
    setEditMesa(null);
    const nextNum = mesas?.length ? Math.max(...mesas.map((m) => m.numero)) + 1 : 1;
    setFormNumero(String(nextNum));
    setFormNome(`Mesa ${nextNum}`);
    setShowForm(true);
  }

  function openEdit(mesa: Mesa) {
    setEditMesa(mesa);
    setFormNumero(String(mesa.numero));
    setFormNome(mesa.nome);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditMesa(null);
    setFormNumero("");
    setFormNome("");
  }

  function getMesaUrl(mesa: Mesa) {
    const base = window.location.origin;
    return `${base}/loja/${slug}/mesa/${mesa.qr_code_token}`;
  }

  function downloadQR(mesa: Mesa) {
    const svg = document.getElementById(`qr-${mesa.id}`) as unknown as SVGSVGElement;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);
      const link = document.createElement("a");
      link.download = `mesa-${mesa.numero}-qrcode.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Mesas</h2>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Mesa
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mesas?.map((mesa) => (
            <Card key={mesa.id} className={!mesa.ativo ? "opacity-60" : ""}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold">{mesa.nome}</span>
                    <Badge variant="outline" className="ml-2">#{mesa.numero}</Badge>
                  </div>
                  <Switch
                    checked={mesa.ativo}
                    onCheckedChange={(ativo) => toggleAtivo.mutate({ id: mesa.id, ativo })}
                  />
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setQrMesa(mesa)}>
                    <QrCode className="h-3.5 w-3.5" /> QR Code
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(mesa)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => {
                    if (confirm("Remover esta mesa?")) deleteMesa.mutate(mesa.id);
                  }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {mesas?.length === 0 && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma mesa cadastrada. Clique em "Nova Mesa" para começar.
          </div>
        )}
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) closeForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMesa ? "Editar Mesa" : "Nova Mesa"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Número *</Label>
              <Input type="number" min="1" value={formNumero} onChange={(e) => setFormNumero(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input value={formNome} onChange={(e) => setFormNome(e.target.value)} placeholder="Ex: Mesa 5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>Cancelar</Button>
            <Button onClick={() => upsertMesa.mutate()} disabled={upsertMesa.isPending}>
              {upsertMesa.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code dialog */}
      <Dialog open={!!qrMesa} onOpenChange={(o) => { if (!o) setQrMesa(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Code — {qrMesa?.nome}</DialogTitle>
          </DialogHeader>
          {qrMesa && (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG
                  id={`qr-${qrMesa.id}`}
                  value={getMesaUrl(qrMesa)}
                  size={256}
                  level="M"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center break-all">{getMesaUrl(qrMesa)}</p>
              <Button className="w-full gap-2" onClick={() => downloadQR(qrMesa)}>
                <Download className="h-4 w-4" /> Baixar QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
