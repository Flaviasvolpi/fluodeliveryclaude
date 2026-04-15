import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";

function slugify(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "").substring(0, 40);
}

interface Props {
  onComplete: (data: { empresaId: string; empresaSlug: string }) => void;
}

export default function Step1CriarConta({ onComplete }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [empresaNome, setEmpresaNome] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-generate slug from empresa name
  useEffect(() => {
    if (!slugManual && empresaNome) {
      setSlug(slugify(empresaNome));
    }
  }, [empresaNome, slugManual]);

  // Debounced slug check
  const checkSlug = useCallback(async (s: string) => {
    if (s.length < 2) { setSlugAvailable(null); return; }
    setSlugChecking(true);
    try {
      const res = await fetch(`${api.defaults.baseURL}/empresas/check-slug/${s}`);
      const data = await res.json();
      setSlugAvailable(data.available);
    } catch { setSlugAvailable(null); }
    setSlugChecking(false);
  }, []);

  useEffect(() => {
    if (!slug) { setSlugAvailable(null); return; }
    const timer = setTimeout(() => checkSlug(slug), 400);
    return () => clearTimeout(timer);
  }, [slug, checkSlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        full_name: fullName,
        email,
        password,
        empresa_nome: empresaNome,
        empresa_slug: slug,
      });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      onComplete({ empresaId: data.empresa.id, empresaSlug: data.empresa.slug });
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(", ") : msg || "Erro ao criar conta");
    }
    setLoading(false);
  }

  const canSubmit = fullName.length >= 3 && email.includes("@") && password.length >= 6 && empresaNome.length >= 2 && slug.length >= 2 && slugAvailable !== false;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">Crie sua conta</h2>
        <p className="text-sm text-muted-foreground">Dados do responsável e do estabelecimento</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Seu nome completo *</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="João da Silva" required minLength={3} />
        </div>
        <div className="space-y-1">
          <Label>Email *</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Senha *</Label>
        <div className="relative">
          <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} className="pr-10" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="border-t pt-4 mt-4" />

      <div className="space-y-1">
        <Label>Nome do estabelecimento *</Label>
        <Input value={empresaNome} onChange={(e) => setEmpresaNome(e.target.value)} placeholder="Ex: Lanchonete do João" required minLength={2} />
      </div>

      <div className="space-y-1">
        <Label>Endereço do cardápio (slug) *</Label>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0 flex-1">
            <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0">seusite.com/loja/</span>
            <Input
              className="rounded-l-none"
              value={slug}
              onChange={(e) => { setSlugManual(true); setSlug(slugify(e.target.value)); }}
              placeholder="meu-restaurante"
              required
              minLength={2}
            />
          </div>
          <div className="w-6 flex items-center justify-center">
            {slugChecking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {!slugChecking && slugAvailable === true && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            {!slugChecking && slugAvailable === false && <XCircle className="h-5 w-5 text-red-500" />}
          </div>
        </div>
        {slugAvailable === false && <p className="text-xs text-red-500">Este endereço já está em uso. Escolha outro.</p>}
      </div>

      {error && <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 text-sm text-destructive">{error}</div>}

      <Button type="submit" className="w-full" size="lg" disabled={!canSubmit || loading}>
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        {loading ? "Criando conta..." : "Criar conta e continuar"}
      </Button>
    </form>
  );
}
