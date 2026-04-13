import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock, Mail, ArrowLeft, ShieldCheck, Eye, EyeOff } from "lucide-react";
import logoFluoDelivery from "@/assets/logo-fluodelivery.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError("Email ou senha inválidos.");
    } else {
      navigate("/admin");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Top bar */}
      <div className="p-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar ao site
        </Link>
      </div>

      {/* Center content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md space-y-6">
          {/* Logo & heading */}
          <div className="text-center space-y-3">
            <img src={logoFluoDelivery} alt="FluoDelivery" className="h-24 mx-auto" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Painel de Gestão</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Acesso exclusivo para estabelecimentos cadastrados
              </p>
            </div>
          </div>

          {/* Login card */}
          <Card className="border shadow-lg">
            <CardContent className="pt-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="seu@email.com"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
                  {loading ? "Entrando..." : (
                    <>
                      <Lock className="h-4 w-4" /> Acessar painel
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Demo button */}
          <div className="text-center space-y-2">
            <Button
              variant="outline"
              className="w-full border-[hsl(var(--fluo-brand))] text-[hsl(var(--fluo-brand))] hover:bg-[hsl(var(--fluo-brand))/0.1] gap-2"
              size="lg"
              onClick={() => navigate('/loja/minha-empresa')}
            >
              <Eye className="h-4 w-4" /> Ver Demonstração
            </Button>
            <p className="text-xs text-muted-foreground">Conheça o cardápio digital em ação</p>
          </div>

          {/* Info box */}
          <div className="bg-muted/50 border rounded-xl p-4 flex gap-3">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground mb-1">Ainda não tem uma conta?</p>
              <p>
                O acesso ao painel é criado durante a ativação do seu estabelecimento.{" "}
                <Link to="/#contato" className="text-primary hover:underline font-medium">
                  Solicite uma demonstração
                </Link>{" "}
                para começar a usar o FluoDelivery.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
