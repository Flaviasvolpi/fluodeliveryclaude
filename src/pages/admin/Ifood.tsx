import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useEmpresa } from "@/contexts/EmpresaContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, RefreshCw, Power, PowerOff, Clock, Link2, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useStatusConfig } from "@/hooks/useStatusConfig";

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const IFOOD_ACTIONS = [
  { value: "", label: "Nenhuma ação" },
  { value: "confirm", label: "Confirmar pedido" },
  { value: "startPreparation", label: "Iniciar preparo" },
  { value: "readyToPickup", label: "Pronto p/ retirada" },
  { value: "dispatch", label: "Despachar entrega" },
];

export default function Ifood() {
  const { empresaId } = useEmpresa();
  const qc = useQueryClient();

  // ---- Config ----
  const { data: config } = useQuery({
    queryKey: ["ifood-config", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/ifood/config`);
      return data;
    },
  });

  const [merchantId, setMerchantId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [webhookMode, setWebhookMode] = useState(false);

  useEffect(() => {
    if (config) {
      setMerchantId(config.ifood_merchant_id ?? "");
      setClientId(config.ifood_client_id ?? "");
      setClientSecret("");
      setWebhookMode(config.ifood_webhook_mode ?? false);
    }
  }, [config]);

  const saveConfig = useMutation({
    mutationFn: async () => {
      const payload: any = {
        ifood_merchant_id: merchantId,
        ifood_client_id: clientId,
        ifood_webhook_mode: webhookMode,
      };
      if (clientSecret) payload.ifood_client_secret = clientSecret;
      await api.put(`/empresas/${empresaId}/ifood/config`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ifood-config"] });
      toast.success("Configuração iFood salva!");
    },
    onError: () => toast.error("Erro ao salvar configuração."),
  });

  // ---- Activate/Deactivate ----
  const isActive = config?.ifood_ativo ?? false;

  const toggleActive = useMutation({
    mutationFn: async () => {
      const endpoint = isActive ? "deactivate" : "activate";
      await api.post(`/empresas/${empresaId}/ifood/${endpoint}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ifood-config"] });
      qc.invalidateQueries({ queryKey: ["ifood-status-mappings"] });
      toast.success(isActive ? "iFood desativado" : "iFood ativado!");
    },
    onError: () => toast.error("Erro ao alterar status."),
  });

  // ---- Status Mappings ----
  const { data: statusConfigs } = useStatusConfig(empresaId);
  const { data: mappings } = useQuery({
    queryKey: ["ifood-status-mappings", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/ifood/status-mappings`);
      return data as { local_status_key: string; ifood_action: string }[];
    },
  });

  const [localMappings, setLocalMappings] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mappings) {
      const map: Record<string, string> = {};
      for (const m of mappings) map[m.local_status_key] = m.ifood_action;
      setLocalMappings(map);
    }
  }, [mappings]);

  const saveMappings = useMutation({
    mutationFn: async () => {
      const rows = Object.entries(localMappings)
        .filter(([, action]) => action)
        .map(([local_status_key, ifood_action]) => ({ local_status_key, ifood_action }));
      await api.put(`/empresas/${empresaId}/ifood/status-mappings`, { mappings: rows });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ifood-status-mappings"] });
      toast.success("Mapeamentos salvos!");
    },
    onError: () => toast.error("Erro ao salvar mapeamentos."),
  });

  // ---- Catalog Sync ----
  const { data: syncStatus } = useQuery({
    queryKey: ["ifood-sync-status", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/ifood/sync-status`);
      return data;
    },
    refetchInterval: 30000,
  });

  const syncCatalog = useMutation({
    mutationFn: () => api.post(`/empresas/${empresaId}/ifood/sync-catalog`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ifood-sync-status"] });
      toast.success("Cardápio sincronizado!");
    },
    onError: () => toast.error("Erro ao sincronizar cardápio."),
  });

  // ---- Horários ----
  const { data: horarios } = useQuery({
    queryKey: ["horarios", empresaId],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${empresaId}/horarios`);
      return data as { dia_semana: number; hora_abrir: string; hora_fechar: string; ativo: boolean }[];
    },
  });

  const [localHorarios, setLocalHorarios] = useState<{ dia_semana: number; hora_abrir: string; hora_fechar: string; ativo: boolean }[]>([]);

  useEffect(() => {
    if (horarios?.length) {
      setLocalHorarios([...horarios]);
    } else {
      setLocalHorarios(DIAS_SEMANA.map((_, i) => ({ dia_semana: i, hora_abrir: "09:00", hora_fechar: "23:00", ativo: true })));
    }
  }, [horarios]);

  const saveHorarios = useMutation({
    mutationFn: async () => {
      await api.put(`/empresas/${empresaId}/horarios`, { horarios: localHorarios });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["horarios"] });
      toast.success("Horários salvos!");
    },
    onError: () => toast.error("Erro ao salvar horários."),
  });

  const webhookUrl = `${window.location.origin}/api/webhooks/ifood`;

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Integração iFood</h2>
            <p className="text-sm text-muted-foreground">Configure a conexão com a plataforma iFood</p>
          </div>
          <Badge variant={isActive ? "default" : "secondary"} className="text-sm">
            {isActive ? "Ativo" : "Inativo"}
          </Badge>
        </div>

        {/* Credenciais */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Link2 className="h-4 w-4" /> Credenciais</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Merchant ID</Label>
              <Input value={merchantId} onChange={(e) => setMerchantId(e.target.value)} placeholder="UUID do merchant no iFood" />
            </div>
            <div className="space-y-1">
              <Label>Client ID</Label>
              <Input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="Client ID da aplicação" />
            </div>
            <div className="space-y-1">
              <Label>Client Secret</Label>
              <Input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} placeholder={config?.ifood_client_secret ? config.ifood_client_secret : "Client Secret"} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={webhookMode} onCheckedChange={setWebhookMode} />
              <Label>Modo Webhook (ao invés de Polling)</Label>
            </div>
            {webhookMode && (
              <div className="bg-muted rounded-lg p-3 text-sm">
                <p className="font-medium mb-1">URL do Webhook</p>
                <code className="text-xs break-all">{webhookUrl}</code>
                <p className="text-muted-foreground text-xs mt-1">Configure esta URL no Portal de Parceiros iFood</p>
              </div>
            )}
            <Button onClick={() => saveConfig.mutate()} disabled={saveConfig.isPending}>
              <Save className="h-4 w-4 mr-2" /> Salvar Credenciais
            </Button>
          </CardContent>
        </Card>

        {/* Ativação */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2">{isActive ? <Power className="h-4 w-4 text-green-500" /> : <PowerOff className="h-4 w-4" />} Ativação</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {isActive
                ? "A integração está ativa. Pedidos do iFood serão recebidos automaticamente."
                : "Ative para começar a receber pedidos do iFood. Um tipo de pedido 'iFood' será criado automaticamente."}
            </p>
            <Button
              variant={isActive ? "destructive" : "default"}
              onClick={() => toggleActive.mutate()}
              disabled={toggleActive.isPending || (!isActive && !merchantId)}
            >
              {toggleActive.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {isActive ? "Desativar iFood" : "Ativar iFood"}
            </Button>
          </CardContent>
        </Card>

        {/* Mapeamento de Status */}
        {isActive && statusConfigs && (
          <Card>
            <CardHeader><CardTitle className="text-base">Mapeamento de Status → iFood</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Defina qual ação executar no iFood quando o status do pedido mudar localmente.</p>
              {statusConfigs.map((sc) => (
                <div key={sc.status_key} className="flex items-center gap-3">
                  <span className="text-sm w-32 font-medium">{sc.label}</span>
                  <Select value={localMappings[sc.status_key] ?? ""} onValueChange={(v) => setLocalMappings((p) => ({ ...p, [sc.status_key]: v }))}>
                    <SelectTrigger className="w-52"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                    <SelectContent>
                      {IFOOD_ACTIONS.map((a) => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <Button onClick={() => saveMappings.mutate()} disabled={saveMappings.isPending} size="sm">
                <Save className="h-4 w-4 mr-2" /> Salvar Mapeamentos
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Sync Cardápio */}
        {isActive && (
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Sincronização de Cardápio</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                {syncStatus?.last_status === "success" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {syncStatus?.last_status === "error" && <XCircle className="h-4 w-4 text-red-500" />}
                {syncStatus?.pending_sync && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                <span>
                  {syncStatus?.last_sync_at
                    ? `Último sync: ${new Date(syncStatus.last_sync_at).toLocaleString("pt-BR")}`
                    : "Nunca sincronizado"}
                </span>
                {syncStatus?.pending_sync && <Badge variant="outline" className="text-xs">Pendente</Badge>}
              </div>
              {syncStatus?.last_error && (
                <p className="text-xs text-red-500">Erro: {syncStatus.last_error}</p>
              )}
              <Button onClick={() => syncCatalog.mutate()} disabled={syncCatalog.isPending} variant="outline" size="sm">
                {syncCatalog.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Sincronizar Agora
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Horários de Funcionamento */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Horários de Funcionamento</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {localHorarios.map((h, i) => (
              <div key={h.dia_semana} className="flex items-center gap-3">
                <Switch
                  checked={h.ativo}
                  onCheckedChange={(v) => {
                    const next = [...localHorarios];
                    next[i] = { ...next[i], ativo: v };
                    setLocalHorarios(next);
                  }}
                />
                <span className="text-sm w-20 font-medium">{DIAS_SEMANA[h.dia_semana]}</span>
                <Input
                  type="time"
                  className="w-28 h-8"
                  value={h.hora_abrir}
                  disabled={!h.ativo}
                  onChange={(e) => {
                    const next = [...localHorarios];
                    next[i] = { ...next[i], hora_abrir: e.target.value };
                    setLocalHorarios(next);
                  }}
                />
                <span className="text-muted-foreground">até</span>
                <Input
                  type="time"
                  className="w-28 h-8"
                  value={h.hora_fechar}
                  disabled={!h.ativo}
                  onChange={(e) => {
                    const next = [...localHorarios];
                    next[i] = { ...next[i], hora_fechar: e.target.value };
                    setLocalHorarios(next);
                  }}
                />
              </div>
            ))}
            <Button onClick={() => saveHorarios.mutate()} disabled={saveHorarios.isPending} size="sm">
              <Save className="h-4 w-4 mr-2" /> Salvar Horários
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
