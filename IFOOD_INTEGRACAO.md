# Integração iFood — Documentação Técnica

## Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Schema do Banco de Dados](#schema-do-banco-de-dados)
4. [Módulo Backend (NestJS)](#módulo-backend-nestjs)
5. [Fluxo de Autenticação](#fluxo-de-autenticação)
6. [Recebimento de Pedidos](#recebimento-de-pedidos)
7. [Sincronização de Status](#sincronização-de-status)
8. [Sincronização de Cardápio](#sincronização-de-cardápio)
9. [Webhook vs Polling](#webhook-vs-polling)
10. [Horários de Funcionamento](#horários-de-funcionamento)
11. [Endpoints da API](#endpoints-da-api)
12. [Frontend (Painel Admin)](#frontend-painel-admin)
13. [Configuração e Ativação](#configuração-e-ativação)
14. [Mapeamento de Entidades](#mapeamento-de-entidades)
15. [Testes com Sandbox iFood](#testes-com-sandbox-ifood)
16. [Homologação](#homologação)
17. [Troubleshooting](#troubleshooting)

---

## Visão Geral

A integração com o iFood permite que estabelecimentos cadastrados no FluoDelivery recebam pedidos da plataforma iFood automaticamente, sincronizem o cardápio e atualizem o status dos pedidos de forma bidirecional.

### Princípio de Design

A integração foi construída para **maximizar o reuso das entidades existentes**. Pedidos do iFood passam pelo mesmo pipeline (`PedidosService.criarPedido()`) que pedidos internos, garantindo:

- Upsert automático do cliente por telefone
- Numeração sequencial unificada
- Programa de fidelidade aplicado
- Cupons validados
- Criação atômica (transação Prisma)

### Capacidades

| Funcionalidade | Status |
|---------------|--------|
| Receber pedidos do iFood | Implementado |
| Confirmar pedidos automaticamente | Implementado |
| Sincronizar status local → iFood | Implementado |
| Receber atualizações de status do iFood | Implementado |
| Sincronizar cardápio para o iFood | Implementado |
| Receber eventos via Polling (30s) | Implementado |
| Receber eventos via Webhook | Implementado |
| Gerenciar horários de funcionamento | Implementado |
| Controlar status da loja (aberto/fechado) | Implementado |
| Painel de configuração no admin | Implementado |

---

## Arquitetura

```
┌──────────────────────────────────────────────────────────────────┐
│                        FluoDelivery                              │
│                                                                  │
│  ┌────────────────┐     ┌─────────────────────────────────────┐ │
│  │  Frontend React │     │         Backend NestJS              │ │
│  │                 │     │                                     │ │
│  │  Ifood.tsx ─────┼────▶│  IfoodController (admin endpoints)  │ │
│  │  (admin config) │     │           │                         │ │
│  └────────────────┘     │  ┌────────▼────────┐                │ │
│                          │  │ IfoodAuthService │ ◀── Token     │ │
│                          │  │ (OAuth 2.0)      │     Cache     │ │
│                          │  └────────┬────────┘   (IfoodToken) │ │
│                          │           │                         │ │
│                          │  ┌────────▼────────┐                │ │
│                          │  │ IfoodApiService  │ ◀──▶ iFood API│ │
│                          │  │ (HTTP wrapper)   │                │ │
│                          │  └──┬────┬────┬────┘                │ │
│                          │     │    │    │                      │ │
│                          │     ▼    ▼    ▼                      │ │
│  ┌──────────┐            │  Events Orders Catalog               │ │
│  │ iFood    │ ──polling──▶  Service Service Service             │ │
│  │ Platform │ ──webhook──▶     │                                │ │
│  └──────────┘            │     ▼                                │ │
│                          │  PedidosService.criarPedido()        │ │
│                          │  (pipeline existente)                │ │
│                          └─────────────────────────────────────┘ │
│                                       │                          │
│                          ┌────────────▼──────────────┐           │
│                          │      PostgreSQL            │           │
│                          │  (Pedido, Cliente, etc.)   │           │
│                          └───────────────────────────┘           │
└──────────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

```
iFood Platform
    │
    ├── Polling (a cada 30s) ──▶ IfoodPollingJob
    │                                │
    └── Webhook (push) ────────▶ IfoodWebhookController
                                     │
                                     ▼
                              IfoodEventsService
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                 │
                    ▼                ▼                 ▼
              PLACED/CREATED    CANCELLED        STATUS_UPDATE
                    │                │                 │
                    ▼                ▼                 ▼
            IfoodOrdersService  Atualiza pedido  Atualiza pedido
                    │           p/ "cancelado"    local status
                    ▼
          PedidosService.criarPedido()
                    │
                    ▼
            Pedido criado no banco
            (com ifood_order_id)
```

---

## Schema do Banco de Dados

### Campos adicionados em modelos existentes

#### Empresa

```sql
ALTER TABLE empresas ADD COLUMN ifood_merchant_id VARCHAR;
ALTER TABLE empresas ADD COLUMN ifood_client_id VARCHAR;
ALTER TABLE empresas ADD COLUMN ifood_client_secret VARCHAR;
ALTER TABLE empresas ADD COLUMN ifood_ativo BOOLEAN DEFAULT false;
ALTER TABLE empresas ADD COLUMN ifood_webhook_mode BOOLEAN DEFAULT false;
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `ifood_merchant_id` | String? | UUID do merchant no iFood |
| `ifood_client_id` | String? | Client ID da aplicação OAuth |
| `ifood_client_secret` | String? | Client Secret (armazenado criptografado em produção) |
| `ifood_ativo` | Boolean | Integração ativa/inativa |
| `ifood_webhook_mode` | Boolean | `false` = polling, `true` = webhook |

#### Produto

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `ifood_product_id` | String? | Código externo no catálogo iFood |

#### ProdutoVariante

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `ifood_product_id` | String? | Código externo da variante no iFood |

#### Categoria

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `ifood_category_id` | String? | Código externo da categoria no iFood |

#### AdicionaisGrupo

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `ifood_group_id` | String? | ID do grupo de complementos no iFood |

#### AdicionaisItem

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `ifood_option_id` | String? | ID da opção de complemento no iFood |

#### Pedido

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `ifood_order_id` | String? (unique) | UUID do pedido no iFood |
| `ifood_display_id` | String? | Código de exibição do pedido (visível ao lojista) |

### Novos modelos

#### IfoodToken

Cache do token OAuth por empresa. Evita chamadas desnecessárias ao endpoint de autenticação.

```prisma
model IfoodToken {
  id          String   @id @db.Uuid
  empresaId   String   @unique @map("empresa_id") @db.Uuid
  accessToken String   @map("access_token")
  expiresAt   DateTime @map("expires_at")
  createdAt   DateTime @default(now()) @map("created_at")
}
```

#### IfoodEventLog

Deduplicação e auditoria de eventos. Garante processamento "exactly-once" mesmo com entrega "at-least-once" do iFood.

```prisma
model IfoodEventLog {
  id           String   @id @db.Uuid
  empresaId    String   @map("empresa_id") @db.Uuid
  eventId      String   @map("event_id")        -- ID único do evento no iFood
  eventType    String   @map("event_type")       -- PLACED, CONFIRMED, CANCELLED, etc.
  ifoodOrderId String   @map("ifood_order_id")
  payload      Json                               -- Evento completo para auditoria
  processedAt  DateTime @default(now())

  @@unique([empresaId, eventId])                  -- Chave de deduplicação
}
```

#### IfoodStatusMapping

Mapeamento configurável entre status locais e ações na API do iFood.

```prisma
model IfoodStatusMapping {
  id             String @id @db.Uuid
  empresaId      String @map("empresa_id") @db.Uuid
  localStatusKey String @map("local_status_key")  -- ex: "confirmado", "preparo"
  ifoodAction    String @map("ifood_action")       -- ex: "confirm", "startPreparation"

  @@unique([empresaId, localStatusKey])
}
```

#### IfoodCatalogSync

Rastreia o estado da sincronização de cardápio. Respeita o rate limit de 30 minutos do iFood.

```prisma
model IfoodCatalogSync {
  id          String    @id @db.Uuid
  empresaId   String    @unique @map("empresa_id") @db.Uuid
  lastSyncAt  DateTime? @map("last_sync_at")
  lastStatus  String?   @map("last_status")   -- "success" | "error" | "pending"
  lastError   String?   @map("last_error")
  pendingSync Boolean   @default(false)
}
```

#### HorarioFuncionamento

Horários de funcionamento por dia da semana. Útil tanto para o iFood quanto para exibição na loja pública.

```prisma
model HorarioFuncionamento {
  id         String  @id @db.Uuid
  empresaId  String  @map("empresa_id") @db.Uuid
  diaSemana  Int     @map("dia_semana")    -- 0=Domingo ... 6=Sábado
  horaAbrir  String  @map("hora_abrir")    -- "09:00"
  horaFechar String  @map("hora_fechar")   -- "23:00"
  ativo      Boolean @default(true)

  @@unique([empresaId, diaSemana])
}
```

---

## Módulo Backend (NestJS)

### Estrutura de Arquivos

```
backend/src/ifood/
├── ifood.module.ts               -- Módulo NestJS (registra controllers, services, imports)
├── ifood.controller.ts           -- 11 endpoints admin + HorariosController
├── ifood-webhook.controller.ts   -- POST /webhooks/ifood (público, 202)
├── ifood-auth.service.ts         -- OAuth token management com cache DB
├── ifood-api.service.ts          -- Wrapper HTTP para toda a API iFood
├── ifood-events.service.ts       -- Processamento de eventos (dedup + roteamento)
├── ifood-orders.service.ts       -- Transformação pedido iFood → criarPedido()
├── ifood-catalog.service.ts      -- Push de cardápio local → iFood
├── ifood-status.service.ts       -- Event listener: status local → ação iFood
├── ifood-polling.job.ts          -- Job setInterval 30s (polling obrigatório)
└── dto/
    └── ifood-config.dto.ts       -- DTOs de validação (config, mappings, horários)
```

### Dependências Adicionadas

```json
{
  "@nestjs/event-emitter": "^3.x",
  "@nestjs/schedule": "^5.x"
}
```

### Registro no AppModule

```typescript
// app.module.ts
imports: [
  EventEmitterModule.forRoot(),  // Comunicação desacoplada entre módulos
  IfoodModule,                    // Módulo iFood
]
```

---

## Fluxo de Autenticação

### OAuth 2.0 — Client Credentials

```
FluoDelivery                              iFood
     │                                      │
     │  POST /authentication/v1.0/oauth/token
     │  grantType=client_credentials        │
     │  clientId=xxx                        │
     │  clientSecret=yyy                    │
     │ ────────────────────────────────────▶│
     │                                      │
     │  { accessToken: "...", expiresIn: 21600 }
     │ ◀────────────────────────────────────│
     │                                      │
     │  (token salvo em IfoodToken)         │
     │  (válido por 6 horas)                │
```

### Implementação (`ifood-auth.service.ts`)

```typescript
async getValidToken(empresaId: string): Promise<string> {
  // 1. Buscar empresa (clientId, clientSecret)
  // 2. Verificar cache em IfoodToken
  //    - Se expiresAt > agora + 5min buffer → retornar cache
  // 3. Caso contrário, buscar novo token na API iFood
  // 4. Upsert no IfoodToken
  // 5. Retornar accessToken
}
```

**Buffer de segurança:** o token é renovado 5 minutos antes de expirar, evitando requisições com token inválido.

**Cache compartilhado:** o token fica no banco de dados (`IfoodToken`), permitindo que múltiplas instâncias do servidor compartilhem o mesmo token sem chamadas duplicadas.

---

## Recebimento de Pedidos

### Pipeline de Ingestão

```
Evento PLACED recebido
         │
         ▼
   Dedup check (IfoodEventLog)
         │
         ▼ (novo evento)
   GET /orders/{id} (detalhes completos)
         │
         ▼
   Mapear itens iFood → CreatePedidoDto
   ├── externalCode → buscar Produto por ifood_product_id
   ├── options[] → buscar AdicionaisItem por ifood_option_id
   ├── Preços: centavos ÷ 100
   └── Endereço: deliveryAddress → JSON
         │
         ▼
   PedidosService.criarPedido(empresaId, dto)
   ├── Upsert Cliente (telefone)
   ├── Incrementar contador sequencial
   ├── Criar Pedido + PedidoItens + PedidoItemAdicionais
   ├── Verificar fidelidade
   └── Tudo em transação atômica
         │
         ▼
   Atualizar pedido com ifood_order_id e ifood_display_id
         │
         ▼
   POST /orders/{id}/confirm (auto-confirmar no iFood)
         │
         ▼
   Log evento em IfoodEventLog
```

### Mapeamento de Dados

| iFood | FluoDelivery | Conversão |
|-------|-------------|-----------|
| `items[].name` | `PedidoItem.nomeSnapshot` | Direto |
| `items[].unitPrice` | `PedidoItem.precoUnitSnapshot` | ÷ 100 (centavos → reais) |
| `items[].quantity` | `PedidoItem.qtd` | Direto |
| `items[].observations` | `PedidoItem.observacaoItem` | Direto |
| `items[].externalCode` | Busca `Produto.ifoodProductId` | Lookup no banco |
| `items[].options[]` | `PedidoItemAdicional` | Mapeado por `ifoodOptionId` |
| `customer.name` | `Pedido.clienteNome` | Direto |
| `customer.phone` | `Pedido.clienteTelefone` | Direto |
| `delivery.deliveryAddress` | `Pedido.endereco` (JSON) | Convertido para formato local |
| `total.deliveryFee` | `Pedido.taxaEntrega` | ÷ 100 |
| `total.discount` | `Pedido.desconto` | ÷ 100 |
| `order.id` | `Pedido.ifoodOrderId` | Direto |
| `order.displayId` | `Pedido.ifoodDisplayId` | Direto |
| Tipo do pedido | `Pedido.tipo = "ifood"` | Fixo |

### Tratamento de Erros

- Se o produto não é encontrado pelo `ifoodProductId`, o pedido ainda é criado com `produtoId: null` e `nomeSnapshot` do iFood
- Se a confirmação automática falha, o erro é logado mas o pedido local já foi criado
- Eventos duplicados são ignorados via check em `IfoodEventLog`

---

## Sincronização de Status

### Fluxo Bidirecional

```
        iFood → FluoDelivery (via eventos)
        ─────────────────────────────────
        CONFIRMED        → confirmado
        PREPARATION_STARTED → preparo
        READY_TO_PICKUP  → pronto
        DISPATCHED       → saiu_entrega
        CONCLUDED        → entregue
        CANCELLED        → cancelado

        FluoDelivery → iFood (via event emitter)
        ─────────────────────────────────────────
        confirmado       → POST /orders/{id}/confirm
        preparo          → POST /orders/{id}/startPreparation
        pronto           → POST /orders/{id}/readyToPickup
        saiu_entrega     → POST /orders/{id}/dispatch
```

### Implementação via Event Emitter

Quando o admin muda o status de um pedido:

```typescript
// PedidosService.updateStatus()
const pedido = await this.prisma.pedido.update({ ... });

this.eventEmitter.emit('pedido.status.changed', {
  empresaId,
  pedidoId: pedido.id,
  ifoodOrderId: pedido.ifoodOrderId,  // null se não é pedido iFood
  newStatus: pedidoStatus,
});
```

O `IfoodStatusService` escuta o evento:

```typescript
@OnEvent('pedido.status.changed')
async handleStatusChanged(event: PedidoStatusChangedEvent) {
  if (!event.ifoodOrderId) return;  // Ignora pedidos não-iFood

  const mapping = await this.prisma.ifoodStatusMapping.findUnique({ ... });
  if (!mapping?.ifoodAction) return;

  // Executa a ação no iFood
  switch (mapping.ifoodAction) {
    case 'confirm': await this.ifoodApi.confirmOrder(...);
    case 'startPreparation': await this.ifoodApi.startPreparation(...);
    // ...
  }
}
```

### Mapeamento Configurável

Os mapeamentos são criados por padrão quando o iFood é ativado, mas podem ser editados pelo admin no painel. Isso permite que cada empresa customize o fluxo conforme sua operação.

---

## Sincronização de Cardápio

### Trigger Automático

```
Produto criado/editado/deletado
         │
         ▼
   EventEmitter: 'produto.changed'
         │
         ▼
   IfoodCatalogService.handleProdutoChanged()
         │
         ▼
   IfoodCatalogSync.pendingSync = true
         │
         ▼
   IfoodPollingJob (a cada 30s) verifica pendingSyncs
         │
         ▼
   Se elapsed >= 30 min desde último sync:
   └── pushCatalog(empresaId)
```

### Estrutura do Payload

```json
{
  "categories": [
    {
      "externalCode": "uuid-local-ou-ifood-id",
      "name": "Lanches",
      "order": 0
    }
  ],
  "items": [
    {
      "externalCode": "uuid-produto",
      "name": "X-Burguer",
      "description": "Pão, hambúrguer, queijo...",
      "imagePath": "http://...",
      "categoryExternalCode": "uuid-categoria",
      "price": { "value": 2500 },
      "shifts": [{ "startTime": "00:00", "endTime": "23:59" }],
      "modifiers": [
        {
          "externalCode": "uuid-grupo",
          "name": "Adicionais",
          "minQuantity": 0,
          "maxQuantity": 3,
          "options": [
            {
              "externalCode": "uuid-item",
              "name": "Bacon extra",
              "price": { "value": 500 }
            }
          ]
        }
      ]
    }
  ]
}
```

### Rate Limit

O iFood exige um intervalo mínimo de **30 minutos** entre envios de catálogo. O sistema controla isso via `IfoodCatalogSync.lastSyncAt`. Múltiplas edições de produto dentro desse intervalo são acumuladas e enviadas de uma vez.

---

## Webhook vs Polling

### Polling (Padrão)

- **Frequência:** a cada 30 segundos (obrigatório pelo iFood)
- **Implementação:** `IfoodPollingJob` com `setInterval(30000)`
- **Funcionamento:** busca eventos pendentes, processa, e envia ACK
- **Vantagem:** mais simples, funciona sem IP público
- **Desvantagem:** latência de até 30s para receber pedidos

### Webhook (Opcional)

- **Endpoint:** `POST /api/webhooks/ifood`
- **Resposta:** `202 Accepted` em menos de 5 segundos
- **Segurança:** verificação HMAC-SHA256 via header `X-IFood-Signature`
- **Processamento:** assíncrono via `setImmediate()` para não bloquear a resposta
- **Vantagem:** latência próxima de zero
- **Desvantagem:** requer IP público e configuração no Portal iFood

### Alternância

O modo é configurável por empresa via `ifood_webhook_mode`. O polling job ignora empresas que usam webhook.

```typescript
// IfoodPollingJob
const empresas = await this.prisma.empresa.findMany({
  where: { ifoodAtivo: true, ifoodWebhookMode: false },  // só polling
});
```

### Verificação de Assinatura (Webhook)

```typescript
const rawBody = JSON.stringify(body);
const expected = crypto
  .createHmac('sha256', empresa.ifoodClientSecret)
  .update(rawBody, 'utf-8')
  .digest('hex');

if (signature !== expected) {
  // Rejeitar silenciosamente
  return;
}
```

---

## Horários de Funcionamento

### Modelo de Dados

7 registros por empresa, um para cada dia da semana:

| dia_semana | hora_abrir | hora_fechar | ativo |
|-----------|-----------|------------|-------|
| 0 (Domingo) | 12:00 | 22:00 | true |
| 1 (Segunda) | 09:00 | 23:00 | true |
| 2 (Terça) | 09:00 | 23:00 | true |
| ... | ... | ... | ... |
| 6 (Sábado) | 09:00 | 00:00 | true |

### Uso

- **iFood:** sincronizado via `PUT /merchants/{id}/opening-hours`
- **Loja pública:** pode exibir horários no cardápio digital
- **Sistema:** pode auto-fechar recebimento de pedidos fora do horário

---

## Endpoints da API

### Configuração (requer autenticação admin)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/empresas/:id/ifood/config` | Obter configuração iFood (secret mascarado) |
| `PUT` | `/empresas/:id/ifood/config` | Salvar credenciais e modo webhook |
| `POST` | `/empresas/:id/ifood/activate` | Ativar integração (cria tipo "iFood", mappings padrão) |
| `POST` | `/empresas/:id/ifood/deactivate` | Desativar integração |

### Status Mappings (requer autenticação admin)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/empresas/:id/ifood/status-mappings` | Listar mapeamentos |
| `PUT` | `/empresas/:id/ifood/status-mappings` | Atualizar mapeamentos em lote |

**Body do PUT:**
```json
{
  "mappings": [
    { "local_status_key": "confirmado", "ifood_action": "confirm" },
    { "local_status_key": "preparo", "ifood_action": "startPreparation" },
    { "local_status_key": "pronto", "ifood_action": "readyToPickup" },
    { "local_status_key": "saiu_entrega", "ifood_action": "dispatch" }
  ]
}
```

### Catálogo (requer autenticação admin)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/empresas/:id/ifood/sync-catalog` | Sincronizar cardápio manualmente |
| `GET` | `/empresas/:id/ifood/sync-status` | Status da última sincronização |

### Merchant (requer autenticação admin)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/empresas/:id/ifood/merchant-status` | Status da loja no iFood (aberto/fechado) |
| `PUT` | `/empresas/:id/ifood/merchant-status` | Alterar status da loja |

**Body do PUT:**
```json
{ "available": true }
```

### Horários (requer autenticação admin)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/empresas/:id/horarios` | Listar horários de funcionamento |
| `PUT` | `/empresas/:id/horarios` | Salvar horários em lote |

**Body do PUT:**
```json
{
  "horarios": [
    { "dia_semana": 0, "hora_abrir": "12:00", "hora_fechar": "22:00", "ativo": true },
    { "dia_semana": 1, "hora_abrir": "09:00", "hora_fechar": "23:00", "ativo": true }
  ]
}
```

### Webhook (público)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/webhooks/ifood` | Receptor de webhooks do iFood (responde 202) |

---

## Frontend (Painel Admin)

### Página: `/admin/:slug/ifood`

**Arquivo:** `src/pages/admin/Ifood.tsx`

A página contém os seguintes cards:

#### 1. Credenciais
Formulário com campos para `Merchant ID`, `Client ID`, `Client Secret` (password) e toggle para modo Webhook. Quando webhook está ativo, exibe a URL do endpoint para configurar no Portal iFood.

#### 2. Ativação
Switch para ativar/desativar a integração. Ao ativar:
- Cria `PedidoTipoConfig` com `tipoKey: "ifood"`
- Cria mapeamentos de status padrão
- Adiciona "ifood" ao `tiposAplicaveis` de todos os status existentes
- Cria tracker de sincronização de catálogo

#### 3. Mapeamento de Status
Tabela com todos os status locais (da `PedidoStatusConfig`). Cada linha tem um dropdown com as ações iFood disponíveis. Permite customizar o fluxo por empresa.

#### 4. Sincronização de Cardápio
Mostra o status da última sincronização (data, resultado, erro). Badge "Pendente" quando há mudanças não sincronizadas. Botão para trigger manual.

#### 5. Horários de Funcionamento
Grid de 7 dias com toggle ativo/inativo e inputs de hora (abrir/fechar). Os horários são salvos no banco e podem ser sincronizados com o iFood.

### Rota e Sidebar

- **Rota:** `/admin/:slug/ifood` (telaKey: `ifood`)
- **Sidebar:** item "iFood" no grupo de configurações com ícone `ExternalLink`

---

## Configuração e Ativação

### Passo a Passo

1. **Registrar no Portal iFood Developer**
   - Criar conta Professional (CNPJ)
   - Criar aplicação (tipo Centralizado)
   - Obter `clientId` e `clientSecret`

2. **Configurar no FluoDelivery**
   - Acessar `/admin/:slug/ifood`
   - Preencher Merchant ID, Client ID, Client Secret
   - Salvar credenciais

3. **Ativar Integração**
   - Clicar em "Ativar iFood"
   - O sistema automaticamente:
     - Cria tipo de pedido "iFood"
     - Cria mapeamentos de status padrão
     - Inicia polling a cada 30s

4. **Mapear Produtos (Opcional)**
   - Para que pedidos do iFood sejam vinculados aos produtos locais:
     - Preencher `ifood_product_id` em cada produto
     - Preencher `ifood_option_id` nos itens de adicionais
   - Se não mapeado, o pedido é criado com nome do iFood mas sem vínculo

5. **Testar**
   - Fazer pedido teste no sandbox iFood
   - Verificar que aparece na lista de pedidos do admin

---

## Mapeamento de Entidades

### Tabela Completa

| FluoDelivery | iFood | Campo de Mapeamento | Observações |
|-------------|-------|-------------------|-------------|
| Empresa | Merchant | `empresa.ifood_merchant_id` | UUID único no iFood |
| Categoria | Category | `categoria.ifood_category_id` | `externalCode` no catálogo |
| Produto | Item | `produto.ifood_product_id` | `externalCode` no catálogo |
| ProdutoVariante | Modifier Option | `variante.ifood_product_id` | Usado como `externalCode` |
| AdicionaisGrupo | Complement Group | `grupo.ifood_group_id` | Grupo de modificadores |
| AdicionaisItem | Complement Option | `item.ifood_option_id` | Opção individual |
| Pedido | Order | `pedido.ifood_order_id` | UUID do pedido iFood |
| Pedido.tipo | Order.type | Fixo: `"ifood"` | Via PedidoTipoConfig |
| PedidoItem | Order Item | Mapeado por `externalCode` | Snapshot de preço |
| PedidoItemAdicional | Order Option | Mapeado por `ifood_option_id` | Snapshot de preço |
| Cliente | Customer | Upsert por telefone | Pipeline existente |
| FormaPagamento | Payment | Não mapeado | iFood gerencia pagamento |

---

## Testes com Sandbox iFood

### Pré-requisitos

1. Conta no iFood Developer Portal (Professional)
2. Aplicação de teste criada
3. Credenciais de sandbox (`clientId`, `clientSecret`)
4. Pelo menos uma loja de teste disponível

### Ambiente de Teste

```env
# .env do backend
IFOOD_API_BASE_URL=https://merchant-api.ifood.com.br  # mesmo para sandbox
```

### Gerar Pedido de Teste

1. Acessar ifood.com.br com usuário de teste (fornecido pelo iFood)
2. Endereço de entrega: **Ramal Bujari, 100** (endereço padrão de teste)
3. Fazer pedido na loja de teste
4. Verificar no FluoDelivery que o pedido apareceu

### Verificação

```bash
# Listar pedidos com tipo iFood
curl -s http://localhost:3000/api/empresas/{id}/pedidos?tipo=ifood \
  -H "Authorization: Bearer {token}"

# Ver logs de eventos
SELECT * FROM ifood_event_log ORDER BY processed_at DESC LIMIT 10;

# Ver token cacheado
SELECT * FROM ifood_tokens WHERE empresa_id = '{id}';
```

---

## Homologação

### Processo

1. Completar desenvolvimento e testes no sandbox
2. Criar aplicação de produção no Portal iFood
3. Solicitar homologação via suporte iFood
4. Sessão remota com analista (~45 minutos)
5. Analista monitora todos os fluxos

### Requisitos para Homologação

- Polling funcionando a cada 30 segundos
- Confirmação automática de pedidos
- Atualização de status funcional
- Tratamento de cancelamentos
- Acknowledgment de todos os eventos
- Catálogo sincronizado

### Critérios Técnicos

| Critério | Implementação |
|---------|--------------|
| Polling a cada 30s | `IfoodPollingJob` com `setInterval(30000)` |
| ACK de eventos | `ifoodApiService.ackEvents()` após processamento |
| Deduplicação | `IfoodEventLog` com unique `(empresaId, eventId)` |
| Confirmação automática | `ifoodApi.confirmOrder()` após ingestão |
| Cancelamento | Evento CANCELLED → pedido status "cancelado" |

---

## Troubleshooting

### Pedidos não chegam

```bash
# 1. Verificar se iFood está ativo
SELECT ifood_ativo, ifood_merchant_id, ifood_client_id
FROM empresas WHERE id = '{empresaId}';

# 2. Verificar logs do polling job
# Procurar por "[iFood]" nos logs do backend

# 3. Testar token manualmente
curl -X POST https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token \
  -d "grantType=client_credentials&clientId={id}&clientSecret={secret}"

# 4. Verificar eventos pendentes
curl https://merchant-api.ifood.com.br/order/v1.0/events:polling \
  -H "Authorization: Bearer {token}"
```

### Token expirado

O token é renovado automaticamente 5 minutos antes de expirar. Se houver problemas:

```sql
-- Forçar renovação deletando o cache
DELETE FROM ifood_tokens WHERE empresa_id = '{empresaId}';
```

### Sync de cardápio falha

```sql
-- Verificar status
SELECT * FROM ifood_catalog_sync WHERE empresa_id = '{empresaId}';

-- Resetar para retry
UPDATE ifood_catalog_sync
SET pending_sync = true, last_error = null
WHERE empresa_id = '{empresaId}';
```

### Eventos duplicados

O sistema já trata duplicatas via `IfoodEventLog`. Se ocorrer:

```sql
-- Ver eventos processados
SELECT event_id, event_type, ifood_order_id, processed_at
FROM ifood_event_log
WHERE empresa_id = '{empresaId}'
ORDER BY processed_at DESC
LIMIT 20;
```

### Status não sincroniza para o iFood

```sql
-- Verificar mapeamentos
SELECT * FROM ifood_status_mappings WHERE empresa_id = '{empresaId}';

-- Verificar se o pedido tem ifood_order_id
SELECT id, ifood_order_id, pedido_status
FROM pedidos
WHERE empresa_id = '{empresaId}' AND ifood_order_id IS NOT NULL
ORDER BY created_at DESC;
```
