import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { useEmpresa } from "@/contexts/EmpresaContext";
import api from "@/lib/api";

import { usePerfilPermissoes } from "@/hooks/usePerfilPermissoes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Users, Loader2, RefreshCw, Shield } from "lucide-react";

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  garcom: { label: "Garçom", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  atendente: { label: "Atendente", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  cozinha: { label: "Cozinha", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  entregador: { label: "Entregador", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
};

const ASSIGNABLE_ROLES = ["garcom", "atendente", "cozinha", "entregador"];

const ALL_TELAS: { key: string; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "atendimento", label: "Atendimento" },
  { key: "pedidos", label: "Pedidos" },
  { key: "cozinha", label: "Cozinha" },
  { key: "fechamento", label: "Fechar Conta" },
  { key: "caixa", label: "Caixa" },
  { key: "vendas", label: "Vendas" },
  { key: "clientes", label: "Clientes" },
  { key: "gestao-entregas", label: "Gestão Entregas" },
  { key: "acerto-entregador", label: "Acerto Entregador" },
  { key: "categorias", label: "Categorias" },
  { key: "produtos", label: "Produtos" },
  { key: "adicionais", label: "Adicionais" },
  { key: "pagamentos", label: "Pagamentos" },
  { key: "mesas", label: "Mesas" },
  { key: "entregadores", label: "Entregadores" },
  { key: "usuarios", label: "Usuários" },
  { key: "tipos-pedido", label: "Tipos de Pedido" },
  { key: "fluxo-status", label: "Fluxo de Status" },
  { key: "configuracoes", label: "Configurações" },
  { key: "fidelidade", label: "Fidelidade" },
  { key: "cupons", label: "Cupons" },
  { key: "margem-lucro", label: "Margem de Lucro" },
  { key: "lucratividade", label: "Lucratividade" },
  { key: "ajuda", label: "Ajuda" },
];

const TELA_LABEL_MAP: Record<string, string> = {};
ALL_TELAS.forEach((t) => { TELA_LABEL_MAP[t.key] = t.label; });

interface UserData {
  user_id: string;
  email: string;
  nome: string;
  roles: { role_id: string; role: string }[];
}

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

async function callUsersFn(params: {
  action: string;
  empresa_id: string;
  method: string;
  body?: Record<string, unknown>;
  user_id?: string;
}) {
  const session = { access_token: localStorage.getItem("access_token") };
  const token = session?.access_token;
  const qs = new URLSearchParams({ action: params.action, empresa_id: params.empresa_id });
  if (params.user_id) qs.set("user_id", params.user_id);
  const url = `https://${PROJECT_ID}.supabase.co/functions/v1/gerenciar-usuarios?${qs}`;
  const res = await fetch(url, {
    method: params.method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: params.body ? JSON.stringify(params.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro ao processar");
  return data;
}

function generatePassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  let pass = "";
  for (let i = 0; i < length; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
  return pass;
}

export default function Usuarios() {
  const { empresa } = useEmpresa();
  const qc = useQueryClient();
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState<UserData | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [editRoles, setEditRoles] = useState<string[]>([]);

  // Permission editing state
  const [editingPermRole, setEditingPermRole] = useState<string | null>(null);
  const [editPermTelas, setEditPermTelas] = useState<string[]>([]);

  const { permissoesPorRole, isLoading: permLoading } = usePerfilPermissoes();

  const { data: usuarios = [], isLoading } = useQuery<UserData[]>({
    queryKey: ["usuarios", empresa.id],
    queryFn: () => callUsersFn({ action: "list", empresa_id: empresa.id, method: "GET" }),
  });

  const addMutation = useMutation({
    mutationFn: () =>
      callUsersFn({ action: "add", empresa_id: empresa.id, method: "POST", body: { email, password, nome, roles: selectedRoles } }),
    onSuccess: () => { toast.success("Usuário criado!"); qc.invalidateQueries({ queryKey: ["usuarios"] }); setOpenAdd(false); resetForm(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateRolesMutation = useMutation({
    mutationFn: (params: { user_id: string; roles: string[] }) =>
      callUsersFn({ action: "update-roles", empresa_id: empresa.id, method: "POST", body: { user_id: params.user_id, roles: params.roles } }),
    onSuccess: () => { toast.success("Perfis atualizados!"); qc.invalidateQueries({ queryKey: ["usuarios"] }); setOpenEdit(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) =>
      callUsersFn({ action: "remove", empresa_id: empresa.id, method: "DELETE", user_id: userId }),
    onSuccess: () => { toast.success("Usuário removido."); qc.invalidateQueries({ queryKey: ["usuarios"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const savePermMutation = useMutation({
    mutationFn: async ({ role, telas }: { role: string; telas: string[] }) => {
      // Delete existing permissions for this role in this empresa
      await api.get(`/empresas/${empresa.id}/perfil-permissoes`);
      // Insert new permissions
      if (telas.length > 0) {
        const rows = telas.map((tela_key) => ({ empresa_id: empresa.id, role: role as any, tela_key }));
        await api.post(`/empresas/${empresa.id}/perfil-permissoes`, rows);
      }
    },
    onSuccess: () => {
      toast.success("Permissões salvas!");
      qc.invalidateQueries({ queryKey: ["perfil-permissoes"] });
      setEditingPermRole(null);
    },
    onError: () => toast.error("Erro ao salvar permissões."),
  });

  function resetForm() { setNome(""); setEmail(""); setPassword(""); setSelectedRoles([]); }

  function toggleRole(role: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(role) ? list.filter((r) => r !== role) : [...list, role]);
  }

  function openEditDialog(user: UserData) { setEditRoles(user.roles.map((r) => r.role)); setOpenEdit(user); }

  function openPermDialog(role: string) {
    setEditPermTelas(permissoesPorRole[role] ?? []);
    setEditingPermRole(role);
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Usuários</h1>
            <p className="text-muted-foreground text-sm">Gerencie os usuários, perfis e permissões de acesso.</p>
          </div>
          <Dialog open={openAdd} onOpenChange={(v) => { setOpenAdd(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Novo Usuário</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Criar Usuário</DialogTitle></DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (selectedRoles.length === 0) { toast.error("Selecione pelo menos um perfil."); return; }
                  addMutation.mutate();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-medium">Nome</label>
                  <Input placeholder="Nome do usuário" value={nome} onChange={(e) => setNome(e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input placeholder="email@exemplo.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm font-medium">Senha</label>
                  <div className="flex gap-2">
                    <Input placeholder="Senha de acesso" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                    <Button type="button" variant="outline" size="icon" onClick={() => setPassword(generatePassword())} title="Gerar senha aleatória">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  {password && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Anote a senha: <span className="font-mono font-bold text-foreground">{password}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Perfis</label>
                  <div className="space-y-2">
                    {ASSIGNABLE_ROLES.map((role) => (
                      <label key={role} className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors">
                        <Checkbox checked={selectedRoles.includes(role)} onCheckedChange={() => toggleRole(role, selectedRoles, setSelectedRoles)} />
                        <span className="font-medium text-sm">{ROLE_LABELS[role].label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={addMutation.isPending}>
                  {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Criar Usuário
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Profiles & Permissions card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Perfis e Permissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            {permLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {ASSIGNABLE_ROLES.map((role) => {
                  const telas = permissoesPorRole[role] ?? [];
                  return (
                    <div key={role} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={ROLE_LABELS[role].color}>{ROLE_LABELS[role].label}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => openPermDialog(role)}>
                          <Pencil className="h-3.5 w-3.5 mr-1" />Editar
                        </Button>
                      </div>
                      {telas.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Nenhuma tela configurada</p>
                      ) : (
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {telas.map((t) => <li key={t}>• {TELA_LABEL_MAP[t] || t}</li>)}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários Cadastrados
              <Badge variant="secondary" className="ml-2">{usuarios.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : usuarios.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum usuário cadastrado ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Perfis</TableHead>
                    <TableHead className="w-24 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium">{u.email}</TableCell>
                      <TableCell>{u.nome || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r) => (
                            <Badge key={r.role_id} className={ROLE_LABELS[r.role]?.color || ""}>
                              {ROLE_LABELS[r.role]?.label || r.role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(u)} title="Editar perfis">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => { if (confirm(`Remover ${u.email} da empresa?`)) removeMutation.mutate(u.user_id); }}
                            disabled={removeMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit user roles dialog */}
        <Dialog open={!!openEdit} onOpenChange={(v) => { if (!v) setOpenEdit(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Editar Perfis — {openEdit?.nome || openEdit?.email}</DialogTitle></DialogHeader>
            <div className="space-y-2">
              {ASSIGNABLE_ROLES.map((role) => (
                <label key={role} className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors">
                  <Checkbox checked={editRoles.includes(role)} onCheckedChange={() => toggleRole(role, editRoles, setEditRoles)} />
                  <span className="font-medium text-sm">{ROLE_LABELS[role].label}</span>
                </label>
              ))}
            </div>
            <Button
              className="w-full"
              disabled={updateRolesMutation.isPending}
              onClick={() => { if (openEdit) updateRolesMutation.mutate({ user_id: openEdit.user_id, roles: editRoles }); }}
            >
              {updateRolesMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvar
            </Button>
          </DialogContent>
        </Dialog>

        {/* Edit permissions dialog */}
        <Dialog open={!!editingPermRole} onOpenChange={(v) => { if (!v) setEditingPermRole(null); }}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Permissões — {editingPermRole ? ROLE_LABELS[editingPermRole]?.label : ""}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground mb-2">
              Selecione as telas que este perfil pode acessar:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ALL_TELAS.map((tela) => (
                <label key={tela.key} className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors text-sm">
                  <Checkbox
                    checked={editPermTelas.includes(tela.key)}
                    onCheckedChange={() => {
                      setEditPermTelas((prev) =>
                        prev.includes(tela.key) ? prev.filter((t) => t !== tela.key) : [...prev, tela.key]
                      );
                    }}
                  />
                  {tela.label}
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => setEditPermTelas(ALL_TELAS.map((t) => t.key))}>Marcar Todas</Button>
              <Button variant="outline" size="sm" onClick={() => setEditPermTelas([])}>Desmarcar Todas</Button>
            </div>
            <Button
              className="w-full mt-2"
              disabled={savePermMutation.isPending}
              onClick={() => {
                if (editingPermRole) savePermMutation.mutate({ role: editingPermRole, telas: editPermTelas });
              }}
            >
              {savePermMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvar Permissões
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
