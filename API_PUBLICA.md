# FluoDelivery — Documentação da API Pública

## Introdução

A API do FluoDelivery permite que sistemas externos integrem com a plataforma para:
- Consultar o cardápio digital completo
- Buscar produtos por nome ou categoria
- Criar pedidos automaticamente
- Consultar status de pedidos
- Autenticar clientes por telefone
- Gerenciar endereços e cupons de clientes

**Base URL:** `https://seu-servidor.com/api`

---

## Autenticação

A API oferece dois tipos de acesso:

### 1. API Key (para integrações de sistemas)

Envie o header `X-API-Key` com a chave da empresa em todas as requisições.

```
X-API-Key: sua-api-key-aqui
```

Cada empresa possui uma API Key única (UUID). O administrador pode visualizar e regenerar a chave no painel em **Configurações**.

**Endpoints protegidos por API Key:**
- `POST /v1/pedidos`
- `GET /v1/consultar-pedidos`
- `GET /v1/cardapio`
- `GET /v1/buscar-produtos`

### 2. Acesso Público (sem autenticação)

Endpoints públicos não exigem autenticação. Usados pela loja digital e integrações simples.

**Identificação da empresa:** via `empresaId` (UUID) no path da URL ou via slug.

---

## Referência de Endpoints

### Cardápio e Produtos

---

#### GET /v1/cardapio

Retorna o cardápio completo da empresa com categorias, produtos, variantes, ingredientes, adicionais e formas de pagamento.

**Auth:** API Key

**Resposta:**
```json
{
  "cardapio": [
    {
      "id": "uuid-categoria",
      "nome": "Lanches",
      "ordem": 0,
      "produtos": [
        {
          "id": "uuid-produto",
          "nome": "X-Burguer",
          "descricao": "Pão, hambúrguer, queijo, salada",
          "imagem_url": "http://.../imagem.jpg",
          "preco_base": 25.90,
          "possui_variantes": false,
          "ordem": 0,
          "variantes": [],
          "ingredientes": [
            { "id": "uuid", "nome": "Queijo", "removivel": true }
          ],
          "adicionais_grupos": [
            {
              "id": "uuid-grupo",
              "nome": "Extras",
              "min_select": 0,
              "max_select": 3,
              "itens": [
                { "id": "uuid-item", "nome": "Bacon", "preco": 5.00 }
              ]
            }
          ]
        }
      ]
    }
  ],
  "formas_pagamento": [
    { "id": "uuid", "nome": "Dinheiro", "exige_troco": true },
    { "id": "uuid", "nome": "PIX", "exige_troco": false }
  ],
  "taxa_entrega_padrao": 8.00
}
```

---

#### GET /v1/buscar-produtos

Busca produtos por nome ou filtra por categoria.

**Auth:** API Key

**Query parameters:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `q` | string | Busca por nome do produto |
| `categoria` | UUID | Filtra por ID da categoria |

**Exemplo:** `GET /v1/buscar-produtos?q=pizza`

**Resposta:** Array de produtos (mesma estrutura do cardápio).

---

#### GET /empresas/{empresaId}/produtos/active

Retorna todos os produtos ativos da empresa com variantes, ingredientes e adicionais.

**Auth:** Público (sem autenticação)

**Resposta:** Array de produtos ativos.

---

#### GET /empresas/{empresaId}/categorias/active

Retorna todas as categorias ativas da empresa.

**Auth:** Público

**Resposta:**
```json
[
  { "id": "uuid", "nome": "Lanches", "ordem": 0 },
  { "id": "uuid", "nome": "Bebidas", "ordem": 1 }
]
```

---

### Pedidos

---

#### POST /v1/pedidos

Cria um novo pedido via integração externa. O subtotal é calculado automaticamente a partir dos itens.

**Auth:** API Key

**Request body:**
```json
{
  "cliente_nome": "João Silva",
  "cliente_telefone": "11999990000",
  "tipo": "entrega",
  "observacoes": "Sem cebola",
  "itens": [
    {
      "nome": "X-Burguer",
      "preco": 25.90,
      "qtd": 2,
      "variante": "Grande",
      "observacao": "Bem passado",
      "adicionais": [
        { "nome": "Bacon Extra", "preco": 5.00, "qtd": 1 }
      ]
    }
  ]
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `cliente_nome` | string | Sim | Nome do cliente |
| `cliente_telefone` | string | Não | Telefone (usado para identificar/criar cliente) |
| `tipo` | string | Não | Tipo: `retirada`, `entrega`, `mesa` (padrão: `retirada`) |
| `observacoes` | string | Não | Observações gerais do pedido |
| `itens` | array | Sim | Lista de itens (mínimo 1) |
| `itens[].nome` | string | Sim | Nome do produto |
| `itens[].preco` | number | Sim | Preço unitário |
| `itens[].qtd` | integer | Sim | Quantidade |
| `itens[].variante` | string | Não | Nome da variante |
| `itens[].observacao` | string | Não | Observação do item |
| `itens[].adicionais` | array | Não | Adicionais do item |

**Resposta:**
```json
{ "numero_pedido": 42 }
```

**Comportamento:**
- O subtotal é calculado automaticamente (soma de preço × qtd + adicionais)
- Se `cliente_telefone` for informado, o cliente é criado/atualizado automaticamente
- O pedido entra no fluxo normal (aparece na cozinha, pode ter status alterado)
- O programa de fidelidade é processado (se configurado)

---

#### POST /empresas/{empresaId}/pedidos

Cria um pedido com controle total sobre todos os campos. Usado pela loja digital e integrações avançadas.

**Auth:** Público

**Request body:**
```json
{
  "cliente_nome": "Maria Santos",
  "cliente_telefone": "11988880000",
  "tipo": "entrega",
  "endereco": {
    "rua": "Rua Exemplo",
    "numero": "456",
    "bairro": "Centro",
    "complemento": "Apt 12",
    "referencia": "Próximo ao mercado"
  },
  "subtotal": 57.80,
  "taxa_entrega": 8.00,
  "total": 65.80,
  "forma_pagamento_id": "uuid-forma-pagamento",
  "pagar_na_entrega": true,
  "cupom_codigo": "DESC10",
  "observacoes": "Ligar ao chegar",
  "itens": [
    {
      "produto_id": "uuid-produto",
      "produto_variante_id": "uuid-variante",
      "nome_snapshot": "Pizza Grande",
      "variante_nome_snapshot": "Calabresa",
      "preco_unit_snapshot": 45.90,
      "custo_unit_snapshot": 18.00,
      "qtd": 1,
      "observacao_item": "Extra queijo",
      "adicionais": [
        {
          "adicional_item_id": "uuid-adicional",
          "nome_snapshot": "Borda recheada",
          "preco_snapshot": 11.90,
          "qtd": 1
        }
      ]
    }
  ]
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `cliente_nome` | string | Sim | Nome do cliente |
| `cliente_telefone` | string | Não | Telefone |
| `tipo` | string | Sim | `retirada`, `entrega`, `mesa`, `ifood`, etc. |
| `endereco` | object | Condicional | Obrigatório se tipo = `entrega` |
| `subtotal` | number | Sim | Subtotal dos itens |
| `taxa_entrega` | number | Não | Taxa de entrega |
| `total` | number | Não | Total calculado |
| `forma_pagamento_id` | UUID | Não | ID da forma de pagamento |
| `pagar_na_entrega` | boolean | Não | Se pagamento é na entrega |
| `cupom_codigo` | string | Não | Código do cupom de desconto |
| `mesa_id` | UUID | Condicional | Obrigatório se tipo = `mesa` |
| `observacoes` | string | Não | Observações gerais |
| `itens` | array | Sim | Itens do pedido (mínimo 1) |

**Resposta:**
```json
{ "numero_pedido": 43 }
```

---

#### GET /v1/consultar-pedidos

Consulta pedidos da empresa com filtros.

**Auth:** API Key

**Query parameters:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `telefone` | string | Filtrar por telefone do cliente |
| `numero` | integer | Filtrar por número sequencial |
| `status` | string | Filtrar por status (`novo`, `confirmado`, `preparo`, `pronto`, etc.) |

**Exemplo:** `GET /v1/consultar-pedidos?status=novo`

**Resposta:**
```json
[
  {
    "id": "uuid",
    "numero_sequencial": 42,
    "created_at": "2026-04-15T10:30:00Z",
    "cliente_nome": "João Silva",
    "total": 57.80,
    "pedido_status": "novo",
    "tipo": "entrega",
    "itens": [
      { "nome_snapshot": "X-Burguer", "qtd": 2, "preco_unit_snapshot": 25.90 }
    ]
  }
]
```

Máximo 50 pedidos por consulta, ordenados do mais recente ao mais antigo.

---

### Empresa

---

#### GET /empresas/by-slug/{slug}

Retorna dados públicos da empresa pelo slug.

**Auth:** Público

**Exemplo:** `GET /empresas/by-slug/meu-restaurante`

**Resposta:**
```json
{
  "id": "uuid",
  "nome": "Meu Restaurante",
  "slug": "meu-restaurante",
  "telefone": "11999990000",
  "logo_url": "http://.../logo.png",
  "banner_url": "http://.../banner.jpg",
  "ativo": true
}
```

---

#### GET /empresas/check-slug/{slug}

Verifica se um slug está disponível para uso.

**Auth:** Público

**Resposta:**
```json
{ "available": true }
```

---

### Formas de Pagamento

---

#### GET /empresas/{empresaId}/formas-pagamento

Lista as formas de pagamento da empresa.

**Auth:** Público

**Resposta:**
```json
[
  { "id": "uuid", "nome": "Dinheiro", "exige_troco": true, "ativo": true },
  { "id": "uuid", "nome": "PIX", "exige_troco": false, "ativo": true },
  { "id": "uuid", "nome": "Cartão de Crédito", "exige_troco": false, "ativo": true }
]
```

---

### Configurações

---

#### GET /empresas/{empresaId}/configuracoes

Retorna todas as configurações da empresa (chave-valor).

**Auth:** Público

**Resposta:**
```json
[
  { "chave": "taxa_entrega_padrao", "valor": "8.00" },
  { "chave": "tempo_espera", "valor": "30-45 min" },
  { "chave": "tema_cardapio", "valor": "dark" },
  { "chave": "banner_url", "valor": "http://.../banner.jpg" }
]
```

---

### Cupons

---

#### GET /empresas/{empresaId}/cupons

Lista os cupons ativos da empresa.

**Auth:** Público

**Resposta:**
```json
[
  {
    "id": "uuid",
    "codigo": "DESC10",
    "tipo_desconto": "percentual",
    "valor_desconto": 10,
    "valor_minimo": 50.00,
    "uso_maximo": 100,
    "uso_atual": 23,
    "valido_ate": "2026-12-31T23:59:59Z",
    "ativo": true
  }
]
```

---

### Autenticação de Clientes

Endpoints para login/cadastro de clientes da loja digital por telefone + PIN de 4 dígitos.

---

#### POST /v1/cliente-auth/verificar-telefone

Verifica se um telefone já está cadastrado.

**Auth:** Público

**Request:**
```json
{
  "empresa_id": "uuid",
  "telefone": "11999990000"
}
```

**Resposta:** Indica se o telefone existe e se tem conta (PIN cadastrado).

---

#### POST /v1/cliente-auth/cadastrar

Cadastra um novo cliente com telefone, nome e PIN.

**Auth:** Público

**Request:**
```json
{
  "empresa_id": "uuid",
  "telefone": "11999990000",
  "nome": "João Silva",
  "pin": "1234"
}
```

---

#### POST /v1/cliente-auth/verificar

Autentica um cliente com telefone + PIN.

**Auth:** Público

**Request:**
```json
{
  "empresa_id": "uuid",
  "telefone": "11999990000",
  "pin": "1234"
}
```

---

#### POST /v1/cliente-auth/meus-pedidos

Retorna os pedidos de um cliente autenticado.

**Auth:** Público

**Request:**
```json
{
  "cliente_id": "uuid",
  "empresa_id": "uuid"
}
```

---

#### POST /v1/cliente-auth/meus-cupons

Retorna os cupons disponíveis para um cliente.

**Auth:** Público

**Request:**
```json
{
  "cliente_id": "uuid",
  "empresa_id": "uuid"
}
```

---

#### POST /v1/cliente-auth/meus-enderecos

Gerencia endereços do cliente (listar, adicionar, atualizar, remover).

**Auth:** Público

**Request (listar):**
```json
{
  "cliente_id": "uuid",
  "empresa_id": "uuid",
  "action": "listar"
}
```

**Request (adicionar):**
```json
{
  "cliente_id": "uuid",
  "empresa_id": "uuid",
  "action": "add",
  "endereco": {
    "apelido": "Casa",
    "rua": "Rua Exemplo",
    "numero": "123",
    "bairro": "Centro",
    "complemento": "Apt 4",
    "padrao": true
  }
}
```

---

## Códigos de Status HTTP

| Código | Significado |
|--------|-------------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Dados inválidos (campos obrigatórios, formato errado) |
| 401 | Não autenticado (API Key ausente ou inválida) |
| 403 | Sem permissão |
| 404 | Recurso não encontrado |
| 409 | Conflito (ex: email já cadastrado, slug já em uso) |
| 429 | Muitas requisições (rate limit: 1000 req/min) |
| 500 | Erro interno |

## Formato das Respostas de Erro

```json
{
  "statusCode": 400,
  "message": "Descrição do erro",
  "timestamp": "2026-04-15T10:30:00.000Z"
}
```

Quando há múltiplos erros de validação:
```json
{
  "statusCode": 400,
  "message": ["campo1 é obrigatório", "campo2 deve ser um email válido"],
  "timestamp": "2026-04-15T10:30:00.000Z"
}
```

---

## Formato dos Dados

- **IDs:** UUID v4 (ex: `550e8400-e29b-41d4-a716-446655440000`)
- **Datas:** ISO 8601 com timezone (ex: `2026-04-15T10:30:00.000Z`)
- **Valores monetários:** Decimal com 2 casas (ex: `25.90`)
- **Campos de texto:** UTF-8
- **Campos opcionais ausentes:** `null`
- **Nomes de campos:** `snake_case` em todas as respostas

---

## Rate Limiting

- **Limite:** 1000 requisições por minuto por IP
- **Header de resposta:** `Retry-After` quando exceder o limite
- **Código HTTP:** 429 (Too Many Requests)

---

## Exemplos de Integração

### cURL — Consultar cardápio

```bash
curl -H "X-API-Key: sua-api-key" \
  https://seu-servidor.com/api/v1/cardapio
```

### cURL — Criar pedido

```bash
curl -X POST \
  -H "X-API-Key: sua-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "cliente_nome": "João Silva",
    "cliente_telefone": "11999990000",
    "tipo": "retirada",
    "itens": [
      { "nome": "X-Burguer", "preco": 25.90, "qtd": 1 }
    ]
  }' \
  https://seu-servidor.com/api/v1/pedidos
```

### JavaScript (fetch)

```javascript
const API_KEY = "sua-api-key";
const BASE_URL = "https://seu-servidor.com/api";

// Buscar cardápio
const cardapio = await fetch(`${BASE_URL}/v1/cardapio`, {
  headers: { "X-API-Key": API_KEY },
}).then(r => r.json());

// Criar pedido
const pedido = await fetch(`${BASE_URL}/v1/pedidos`, {
  method: "POST",
  headers: {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    cliente_nome: "João Silva",
    tipo: "retirada",
    itens: [{ nome: "X-Burguer", preco: 25.90, qtd: 1 }],
  }),
}).then(r => r.json());

console.log(`Pedido #${pedido.numero_pedido} criado`);
```

### Python (requests)

```python
import requests

API_KEY = "sua-api-key"
BASE_URL = "https://seu-servidor.com/api"
headers = {"X-API-Key": API_KEY, "Content-Type": "application/json"}

# Buscar cardápio
cardapio = requests.get(f"{BASE_URL}/v1/cardapio", headers=headers).json()

# Criar pedido
pedido = requests.post(f"{BASE_URL}/v1/pedidos", headers=headers, json={
    "cliente_nome": "João Silva",
    "tipo": "retirada",
    "itens": [{"nome": "X-Burguer", "preco": 25.90, "qtd": 1}]
}).json()

print(f"Pedido #{pedido['numero_pedido']} criado")
```

---

## Tabela Resumo de Endpoints

| # | Método | Endpoint | Auth | Descrição |
|---|--------|----------|------|-----------|
| 1 | GET | `/v1/cardapio` | API Key | Cardápio completo |
| 2 | GET | `/v1/buscar-produtos` | API Key | Buscar produtos |
| 3 | POST | `/v1/pedidos` | API Key | Criar pedido (simplificado) |
| 4 | GET | `/v1/consultar-pedidos` | API Key | Consultar pedidos |
| 5 | POST | `/v1/cliente-auth/verificar-telefone` | Público | Verificar telefone |
| 6 | POST | `/v1/cliente-auth/verificar` | Público | Login com PIN |
| 7 | POST | `/v1/cliente-auth/cadastrar` | Público | Cadastrar cliente |
| 8 | POST | `/v1/cliente-auth/meus-pedidos` | Público | Pedidos do cliente |
| 9 | POST | `/v1/cliente-auth/meus-cupons` | Público | Cupons do cliente |
| 10 | POST | `/v1/cliente-auth/meus-enderecos` | Público | Endereços do cliente |
| 11 | GET | `/empresas/check-slug/:slug` | Público | Verificar slug |
| 12 | GET | `/empresas/by-slug/:slug` | Público | Dados da empresa |
| 13 | GET | `/empresas/:id/produtos/active` | Público | Produtos ativos |
| 14 | GET | `/empresas/:id/categorias/active` | Público | Categorias ativas |
| 15 | GET | `/empresas/:id/formas-pagamento` | Público | Formas de pagamento |
| 16 | GET | `/empresas/:id/configuracoes` | Público | Configurações |
| 17 | GET | `/empresas/:id/cupons` | Público | Cupons |
| 18 | POST | `/empresas/:id/pedidos` | Público | Criar pedido (completo) |
