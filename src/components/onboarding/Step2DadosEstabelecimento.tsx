import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface Props {
  empresaId: string;
  onComplete: () => void; onBack?: () => void;
}

export default function Step2DadosEstabelecimento({ empresaId, onComplete, onBack }: Props) {
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File, type: "logo" | "banner") {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/uploads/site-assets", formData, { headers: { "Content-Type": "multipart/form-data" } });
      if (type === "logo") setLogoUrl(data.url);
      else setBannerUrl(data.url);
    } catch { toast.error("Erro ao fazer upload"); }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch(`/empresas/${empresaId}`, { telefone, logo_url: logoUrl || undefined, banner_url: bannerUrl || undefined });
      if (endereco) await api.post(`/empresas/${empresaId}/configuracoes`, { chave: "endereco", valor: endereco });
      onComplete();
    } catch { toast.error("Erro ao salvar dados"); }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">Dados do estabelecimento</h2>
        <p className="text-sm text-muted-foreground">Informações que seus clientes verão</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Telefone / WhatsApp *</Label>
          <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" required />
        </div>
        <div className="space-y-1">
          <Label>Endereço *</Label>
          <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, bairro, cidade" required />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Logotipo</Label>
          {logoUrl ? (
            <div className="relative">
              <img src={logoUrl} alt="Logo" className="h-24 w-24 rounded-lg object-cover border" />
              <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => { setLogoUrl(""); logoRef.current?.click(); }}>Trocar</Button>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => logoRef.current?.click()}>
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Clique para enviar o logo</p>
            </div>
          )}
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "logo")} />
        </div>
        <div className="space-y-2">
          <Label>Banner do cardápio</Label>
          {bannerUrl ? (
            <div className="relative">
              <img src={bannerUrl} alt="Banner" className="h-24 w-full rounded-lg object-cover border" />
              <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => { setBannerUrl(""); bannerRef.current?.click(); }}>Trocar</Button>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => bannerRef.current?.click()}>
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Clique para enviar o banner</p>
            </div>
          )}
          <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "banner")} />
        </div>
      </div>

      {uploading && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Enviando imagem...</p>}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">Voltar</Button>
        <Button type="submit" className="flex-1" size="lg" disabled={loading || uploading || !telefone || !endereco}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Continuar
        </Button>
      </div>
    </form>
  );
}
