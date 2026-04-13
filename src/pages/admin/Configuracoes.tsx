import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useEmpresa } from "@/contexts/EmpresaContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Upload, Trash2, ImageIcon, Sun, Moon, Clock, Key, Copy, RefreshCw, Ticket, Store, Globe, Instagram, MapPin } from "lucide-react";
import StatusConfigCard from "@/components/admin/StatusConfigCard";

export default function Configuracoes() {
  const { empresaId } = useEmpresa();
  const queryClient = useQueryClient();
  const [taxaEntrega, setTaxaEntrega] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [temaCardapio, setTemaCardapio] = useState("dark");
  const [mostrarCuponsCheckout, setMostrarCuponsCheckout] = useState(true);
  const [tempoEspera, setTempoEspera] = useState("");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Dados da empresa
  const [empresaNome, setEmpresaNome] = useState("");
  const [empresaTelefone, setEmpresaTelefone] = useState("");
  const [empresaSite, setEmpresaSite] = useState("");
  const [empresaInstagram, setEmpresaInstagram] = useState("");
  const [empresaEndereco, setEmpresaEndereco] = useState("");

  const { data: empresa } = useQuery({
    queryKey: ["empresa-dados", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}`);
      return data;
    },
  });

  useEffect(() => {
    if (empresa) {
      setEmpresaNome(empresa.nome ?? "");
      setEmpresaTelefone(empresa.telefone ?? "");
    }
  }, [empresa]);

  const { data: configs, isLoading } = useQuery({
    queryKey: ["configuracoes", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/configuracoes`);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (configs) {
      const taxa = configs.find((c) => c.chave === "taxa_entrega_padrao");
      if (taxa) setTaxaEntrega(taxa.valor);
      const banner = configs.find((c) => c.chave === "banner_url");
      if (banner) setBannerUrl(banner.valor);
      const logo = configs.find((c) => c.chave === "logo_url");
      if (logo) setLogoUrl(logo.valor);
      const tema = configs.find((c) => c.chave === "tema_cardapio");
      if (tema) setTemaCardapio(tema.valor || "dark");
      const tempo = configs.find((c) => c.chave === "tempo_espera");
      if (tempo) setTempoEspera(tempo.valor);
      const cuponsConfig = configs.find((c) => c.chave === "mostrar_cupons_checkout");
      setMostrarCuponsCheckout(cuponsConfig?.valor !== "false");
      const site = configs.find((c) => c.chave === "site");
      if (site) setEmpresaSite(site.valor);
      const insta = configs.find((c) => c.chave === "instagram");
      if (insta) setEmpresaInstagram(insta.valor);
      const end = configs.find((c) => c.chave === "endereco");
      if (end) setEmpresaEndereco(end.valor);
    }
  }, [configs]);

  async function upsertConfig(chave: string, valor: string) {
    await api.post(`/empresas/${empresaId}/configuracoes`, { chave, valor });
  }

  const salvarDadosEmpresa = useMutation({
    mutationFn: async () => {
      // Update empresas table
      await api.patch(`/empresas/${empresaId}`, { nome: empresaNome, telefone: empresaTelefone });
      // Save extra fields in configuracoes
      await upsertConfig("site", empresaSite);
      await upsertConfig("instagram", empresaInstagram);
      await upsertConfig("endereco", empresaEndereco);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracoes", empresaId] });
      queryClient.invalidateQueries({ queryKey: ["empresa-dados", empresaId] });
      queryClient.invalidateQueries({ queryKey: ["empresa"] });
      toast.success("Dados da empresa salvos!");
    },
    onError: () => toast.error("Erro ao salvar dados da empresa."),
  });

  const salvarTema = useMutation({
    mutationFn: async (valor: string) => {
      await upsertConfig("tema_cardapio", valor);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracoes", empresaId] });
      queryClient.invalidateQueries({ queryKey: ["config-public"] });
      toast.success("Tema salvo!");
    },
    onError: () => toast.error("Erro ao salvar tema."),
  });

  const salvarMostrarCupons = useMutation({
    mutationFn: async (valor: string) => {
      await upsertConfig("mostrar_cupons_checkout", valor);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracoes", empresaId] });
      toast.success("Configuração de cupons salva!");
    },
    onError: () => toast.error("Erro ao salvar configuração."),
  });

  const salvarTaxa = useMutation({
    mutationFn: async () => {
      await upsertConfig("taxa_entrega_padrao", taxaEntrega);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracoes", empresaId] });
      toast.success("Configuração salva!");
    },
    onError: () => toast.error("Erro ao salvar configuração."),
  });

  const salvarTempoEspera = useMutation({
    mutationFn: async () => {
      await upsertConfig("tempo_espera", tempoEspera);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracoes", empresaId] });
      queryClient.invalidateQueries({ queryKey: ["config-public"] });
      toast.success("Tempo de espera salvo!");
    },
    onError: () => toast.error("Erro ao salvar tempo de espera."),
  });

  async function uploadImage(file: File, key: "banner_url" | "logo_url") {
    const isLogo = key === "logo_url";
    const setter = isLogo ? setLogoUrl : setBannerUrl;
    const setUploading = isLogo ? setUploadingLogo : setUploadingBanner;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${key.replace("_url", "")}-${Date.now()}.${ext}`;
      const formData = new FormData();
      formData.append("file", file);
      const { data: uploadResult } = await api.post(`/uploads/site-assets`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      
      const url = uploadResult?.url || path;
      await upsertConfig(key, url);
      setter(url);
      queryClient.invalidateQueries({ queryKey: ["configuracoes", empresaId] });
      toast.success(isLogo ? "Logotipo salvo!" : "Banner salvo!");
    } catch {
      toast.error("Erro ao fazer upload da imagem.");
    } finally {
      setUploading(false);
    }
  }

  async function removeImage(key: "banner_url" | "logo_url") {
    const isLogo = key === "logo_url";
    const setter = isLogo ? setLogoUrl : setBannerUrl;
    try {
      await upsertConfig(key, "");
      setter("");
      queryClient.invalidateQueries({ queryKey: ["configuracoes", empresaId] });
      toast.success("Imagem removida!");
    } catch {
      toast.error("Erro ao remover imagem.");
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-lg space-y-6">
        <h2 className="text-xl font-bold">Configurações</h2>

        {/* Dados da Empresa */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Store className="h-4 w-4" /> Dados da Empresa</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Nome do estabelecimento</Label>
              <Input value={empresaNome} onChange={(e) => setEmpresaNome(e.target.value)} placeholder="Ex: Bruno Lanches" disabled={isLoading} />
            </div>
            <div className="space-y-1">
              <Label>Telefone / WhatsApp</Label>
              <Input value={empresaTelefone} onChange={(e) => setEmpresaTelefone(e.target.value)} placeholder="(11) 99999-9999" disabled={isLoading} />
            </div>
            <div className="space-y-1">
              <Label className="flex items-center gap-1.5"><Globe className="h-4 w-4" /> Site</Label>
              <Input value={empresaSite} onChange={(e) => setEmpresaSite(e.target.value)} placeholder="https://www.meusite.com.br" disabled={isLoading} />
            </div>
            <div className="space-y-1">
              <Label className="flex items-center gap-1.5"><Instagram className="h-4 w-4" /> Instagram</Label>
              <Input value={empresaInstagram} onChange={(e) => setEmpresaInstagram(e.target.value)} placeholder="@meurestaurante" disabled={isLoading} />
            </div>
            <div className="space-y-1">
              <Label className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> Endereço</Label>
              <Input value={empresaEndereco} onChange={(e) => setEmpresaEndereco(e.target.value)} placeholder="Rua Example, 123 - Centro, Cidade - UF" disabled={isLoading} />
            </div>
            <Button onClick={() => salvarDadosEmpresa.mutate()} disabled={salvarDadosEmpresa.isPending}>
              <Save className="mr-2 h-4 w-4" />{salvarDadosEmpresa.isPending ? "Salvando..." : "Salvar dados"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Entrega</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Taxa de entrega padrão (R$)</Label>
              <Input type="number" min="0" step="0.01" placeholder="0.00" value={taxaEntrega} onChange={(e) => setTaxaEntrega(e.target.value)} disabled={isLoading} />
              <p className="text-xs text-muted-foreground">Esse valor será preenchido automaticamente no checkout quando o cliente escolher entrega.</p>
            </div>
            <div className="space-y-1">
              <Label className="flex items-center gap-1.5"><Clock className="h-4 w-4" />Tempo de espera estimado</Label>
              <Input type="text" placeholder="Ex: 30-50 min" value={tempoEspera} onChange={(e) => setTempoEspera(e.target.value)} disabled={isLoading} />
              <p className="text-xs text-muted-foreground">Exibido na tela de pedidos para o cliente. Ex: "30-50 min", "1 hora".</p>
            </div>
            <Button onClick={() => { salvarTaxa.mutate(); salvarTempoEspera.mutate(); }} disabled={salvarTaxa.isPending || salvarTempoEspera.isPending}>
              <Save className="mr-2 h-4 w-4" />{salvarTaxa.isPending || salvarTempoEspera.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Aparência</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Tema do cardápio</Label>
              <p className="text-xs text-muted-foreground">Escolha entre modo escuro ou claro para a página pública de pedidos.</p>
              <div className="flex items-center gap-3">
                <Moon className="h-4 w-4 text-muted-foreground" />
                <Switch checked={temaCardapio === "light"} onCheckedChange={(checked) => { const newTema = checked ? "light" : "dark"; setTemaCardapio(newTema); salvarTema.mutate(newTema); }} />
                <Sun className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground ml-1">{temaCardapio === "light" ? "Claro" : "Escuro"}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Banner da página inicial</Label>
              <p className="text-xs text-muted-foreground">Imagem exibida no topo do cardápio. Recomendado: 1200×400px.</p>
              {bannerUrl ? (
                <div className="relative rounded-lg overflow-hidden border">
                  <img src={bannerUrl} alt="Banner" className="w-full aspect-[3/1] object-cover" />
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={() => removeImage("banner_url")}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center py-8 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => bannerInputRef.current?.click()}>
                  <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Clique para enviar o banner</span>
                </div>
              )}
              <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadImage(file, "banner_url"); e.target.value = ""; }} />
              {bannerUrl && (
                <Button variant="outline" size="sm" onClick={() => bannerInputRef.current?.click()} disabled={uploadingBanner}>
                  <Upload className="mr-2 h-4 w-4" />{uploadingBanner ? "Enviando..." : "Substituir banner"}
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label>Logotipo</Label>
              <p className="text-xs text-muted-foreground">Substitui o texto "Cardápio Digital" no cabeçalho. Recomendado: PNG com fundo transparente, altura ~40px.</p>
              {logoUrl ? (
                <div className="flex items-center gap-4">
                  <div className="border rounded-lg p-3 bg-muted/30"><img src={logoUrl} alt="Logo" className="h-10 max-w-[200px] object-contain" /></div>
                  <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => removeImage("logo_url")}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center py-6 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => logoInputRef.current?.click()}>
                  <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Clique para enviar o logotipo</span>
                </div>
              )}
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadImage(file, "logo_url"); e.target.value = ""; }} />
              {logoUrl && (
                <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                  <Upload className="mr-2 h-4 w-4" />{uploadingLogo ? "Enviando..." : "Substituir logotipo"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Ticket className="h-4 w-4" /> Cupons no Checkout</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">Quando ativado, clientes logados verão seus cupons disponíveis na tela de checkout para aplicar com um clique.</p>
            <div className="flex items-center gap-3">
              <Switch
                checked={mostrarCuponsCheckout}
                onCheckedChange={(checked) => {
                  setMostrarCuponsCheckout(checked);
                  salvarMostrarCupons.mutate(checked ? "true" : "false");
                }}
              />
              <span className="text-sm text-muted-foreground">{mostrarCuponsCheckout ? "Ativado" : "Desativado"}</span>
            </div>
          </CardContent>
        </Card>
        <StatusConfigCard />
        <ApiKeyCard empresaId={empresaId} />
      </div>
    </AdminLayout>
  );
}
function ApiKeyCard({ empresaId }: { empresaId: string }) {
  const [showKey, setShowKey] = useState(false);
  const queryClient = useQueryClient();

  const { data: apiKeyData } = useQuery({
    queryKey: ["empresa-api-key", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/api-key`);
      return data as string | null;
    },
  });

  const regenerar = useMutation({
    mutationFn: async () => {
      await api.post(`/empresas/${empresaId}/api-key/regenerate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa-api-key", empresaId] });
      toast.success("Chave regenerada!");
    },
    onError: () => toast.error("Erro ao regenerar chave."),
  });

  const apiKey = apiKeyData ?? "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Key className="h-4 w-4" /> Chave de API (Integração)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Use esta chave no header <code className="bg-muted px-1 rounded">x-api-key</code> para acessar as APIs externas (cardápio, pedidos, busca).
        </p>
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={showKey ? apiKey : "••••••••••••••••••••••••••••••••"}
            className="font-mono text-sm"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowKey(!showKey)}
            title={showKey ? "Ocultar" : "Mostrar"}
          >
            {showKey ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              navigator.clipboard.writeText(apiKey);
              toast.success("Chave copiada!");
            }}
            title="Copiar"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (confirm("Regenerar a chave? A chave anterior deixará de funcionar.")) {
              regenerar.mutate();
            }
          }}
          disabled={regenerar.isPending}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {regenerar.isPending ? "Regenerando..." : "Regenerar chave"}
        </Button>
      </CardContent>
    </Card>
  );
}
