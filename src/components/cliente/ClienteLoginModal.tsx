import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { useEmpresa } from "@/contexts/EmpresaContext";

const BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/v1/cliente-auth`;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (data: { cliente_id: string; nome: string; telefone: string; empresa_id: string }) => void;
  initialMode?: "login" | "cadastro";
  initialTelefone?: string;
}

export default function ClienteLoginModal({ open, onClose, onSuccess, initialMode, initialTelefone }: Props) {
  const { empresaId } = useEmpresa();
  const [mode, setMode] = useState<"login" | "cadastro">(initialMode || "login");
  const [telefone, setTelefone] = useState(initialTelefone || "");
  const [pin, setPin] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setMode(initialMode || "login");
      setTelefone(initialTelefone || "");
      setPin("");
      setNome("");
    }
  }, [open, initialMode, initialTelefone]);

  const resetForm = () => {
    setTelefone("");
    setPin("");
    setNome("");
    setMode("login");
  };

  const handleLogin = async () => {
    if (!telefone || pin.length !== 4) {
      toast.error("Preencha telefone e PIN de 4 dígitos");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/verificar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresa_id: empresaId, telefone, pin }),
      });
      const data = await res.json();
      if (!res.ok || data.fallback || data.error) {
        if (data.fallback) {
          toast.error("Você ainda não tem PIN cadastrado. Crie sua conta primeiro.");
          setMode("cadastro");
        } else {
          toast.error(data.error || "Erro ao entrar");
        }
        return;
      }
      toast.success(`Bem-vindo(a), ${data.nome}!`);
      onSuccess({ cliente_id: data.cliente_id, nome: data.nome, telefone, empresa_id: empresaId });
      resetForm();
      onClose();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const handleCadastro = async () => {
    if (!telefone || !nome || pin.length !== 4) {
      toast.error("Preencha todos os campos e crie um PIN de 4 dígitos");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/cadastrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresa_id: empresaId, telefone, nome, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao cadastrar");
        return;
      }
      toast.success("Conta criada com sucesso!");
      onSuccess({ cliente_id: data.cliente_id, nome: data.nome || nome, telefone, empresa_id: empresaId });
      resetForm();
      onClose();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { resetForm(); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "login" ? "Acessar minha conta" : "Criar minha conta"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {mode === "cadastro" && (
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={100}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              maxLength={20}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{mode === "cadastro" ? "Crie um PIN de 4 dígitos" : "PIN"}</Label>
            <InputOTP maxLength={4} value={pin} onChange={setPin}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            className="w-full"
            disabled={loading}
            onClick={mode === "login" ? handleLogin : handleCadastro}
          >
            {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Cadastrar"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Primeira vez?{" "}
                <button className="text-primary underline" onClick={() => setMode("cadastro")}>
                  Criar minha conta
                </button>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <button className="text-primary underline" onClick={() => setMode("login")}>
                  Entrar
                </button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
