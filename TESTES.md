# FluoDelivery — Testes Automatizados (QA)

## Visão Geral

O sistema possui uma suíte de testes QA que verifica **todas as funcionalidades** via chamadas HTTP à API. Funciona como um QA automatizado que simula um usuário navegando pelo sistema: faz login, cria categorias, produtos, faz pedidos, altera status, abre caixa, testa integração iFood — tudo de ponta a ponta.

### O que é testado

| Módulo | Verificações | O que testa |
|--------|-------------|-------------|
| Autenticação | 10 | Login, senha errada, refresh token, perfil, empresas |
| Empresa | 4 | Busca por slug (público), busca por ID, edição |
| Categorias | 4 | Criar, listar, listar ativas (público), editar |
| Adicionais | 4 | Criar grupo, criar item, listar, editar preço |
| Produtos | 12 | Produto simples, com variantes/ingredientes, editar, ativar/desativar, endpoints separados |
| Formas Pagamento | 2 | Listar (público), criar |
| Mesas | 4 | Criar, QR code, listar, editar |
| Entregadores | 2 | Criar, listar |
| Configurações | 3 | Upsert, listar, taxa de entrega |
| Tipos de Pedido | 2 | Listar, salvar em lote |
| Fluxo de Status | 2 | Listar, salvar em lote |
| Pedido Retirada | 14 | Criar (público), itens, adicionais, observação, cliente automático, fluxo completo de status |
| Pedido Entrega | 3 | Criar com endereço, atribuir entregador, despachar |
| Pedido Mesa | 1 | Criar pedido vinculado a mesa |
| Cupons | 2 | Criar, listar (público) |
| Fidelidade | 2 | Criar regra, listar |
| Clientes | 1 | Listar (verificar criação automática) |
| Caixa | 4 | Abrir sessão, consultar, registrar recebimento, fechar |
| Usuários | 2 | Criar com role, listar |
| Permissões | 3 | Listar, criar, deletar por role |
| Horários | 2 | Salvar, listar |
| iFood | 8 | Config, credenciais, ativar, tipo criado, mappings, sync status, desativar |
| Upload | 1 | Endpoint existe e valida arquivo |
| Cliente Auth | 1 | Verificar telefone (loja) |
| Cardápio API | 1 | Endpoint v1 com API key |
| **Total** | **94** | |

---

## Pré-requisitos

1. **Backend rodando** em `http://localhost:3000`
2. **Banco de dados** com seed executado (usuário `admin@fluodelivery.com` / `admin123`)
3. **Node.js 18+** instalado

Se o backend não estiver rodando:

```bash
cd backend
npm run start:dev
```

Se o banco estiver vazio, execute o seed:

```bash
cd backend
npx prisma db push
npm run seed
```

---

## Como Executar

### Rodar todos os testes

```bash
cd backend
npx ts-node test/e2e/qa-completo.ts
```

### Rodar apontando para outro servidor

```bash
cd backend
API_URL=https://meu-servidor.com/api npx ts-node test/e2e/qa-completo.ts
```

---

## Saída Esperada

```
═══════════════════════════════════════
  QA COMPLETO — FluoDelivery
  API: http://localhost:3000/api
  Data: 14/04/2026, 17:23:39
═══════════════════════════════════════

🔐 AUTENTICAÇÃO
  ✅ Login com credenciais corretas
  ✅ Retorna access_token
  ✅ Retorna refresh_token
  ✅ Login com senha errada retorna 401
  ...

🍔 PRODUTOS
  ✅ Criar produto simples com categoria e adicionais
  ✅ Criar produto com variantes e ingredientes
  ...

🛒 PEDIDO COMPLETO (fluxo retirada)
  ✅ Criar pedido (público)
  ✅ Pedido criado com número #8
  ✅ Pedido tem 1 item
  ✅ Item tem nome correto
  ✅ Item tem 1 adicional
  ✅ Item tem observação
  ✅ Cliente criado automaticamente por telefone
  ✅ Status atualizado para: confirmado
  ✅ Status atualizado para: preparo
  ✅ Status atualizado para: pronto
  ✅ Status atualizado para: entregue
  ✅ Status final é "entregue"
  ...

═══════════════════════════════════════
  RESULTADO: 94 ✅  0 ❌
═══════════════════════════════════════
```

### Código de saída

- `0` — todos os testes passaram
- `1` — pelo menos um teste falhou

Isso permite usar em scripts de CI/CD:

```bash
npx ts-node test/e2e/qa-completo.ts && echo "OK" || echo "FALHOU"
```

---

## Interpretando Falhas

Quando um teste falha, a saída mostra:

```
  ❌ Criar produto simples com categoria e adicionais
```

E no final, um resumo de todas as falhas:

```
═══════════════════════════════════════
  RESULTADO: 91 ✅  3 ❌

  FALHAS:
    ❌ Criar produto simples com categoria e adicionais
    ❌ Pedido tem 1 item
    ❌ Item tem nome correto
═══════════════════════════════════════
```

### Causas comuns de falha

| Erro | Causa | Solução |
|------|-------|---------|
| Login falha | Backend não rodando | `cd backend && npm run start:dev` |
| Vários 401 | Token expirado ou banco vazio | Executar seed: `npm run seed` |
| Endpoints 404 | Backend desatualizado | `npx prisma generate && npm run start:dev` |
| Criar produto falha | Categoria ou adicional não existe | Teste anterior falhou — verificar logs |
| Caixa falha | Rota errada | Verificar se backend tem a rota `/caixa/sessoes/abrir` |

---

## Estrutura do Arquivo de Testes

```
backend/test/e2e/qa-completo.ts
```

### Organização

O arquivo é dividido em funções independentes, uma para cada módulo:

```typescript
async function testAuth() { ... }       // 🔐 Autenticação
async function testEmpresa() { ... }    // 🏪 Empresa
async function testCategorias() { ... } // 📂 Categorias
async function testAdicionais() { ... } // ➕ Adicionais
async function testProdutos() { ... }   // 🍔 Produtos
async function testPedidoCompleto() { ... } // 🛒 Pedido (fluxo completo)
// ... etc
async function cleanup() { ... }        // 🧹 Limpeza
```

### Fluxo de execução

```
1. Login → obtém token e empresa ID
2. CRUD de entidades base (categorias, adicionais, produtos, mesas, etc.)
3. Pedido completo (retirada) com fluxo de status
4. Pedido entrega com entregador
5. Pedido mesa
6. Financeiro (cupons, fidelidade, caixa)
7. Gestão (usuários, permissões)
8. Configurações (horários, iFood)
9. APIs públicas (upload, cliente auth, cardápio)
10. Limpeza (deleta entidades criadas pelo teste)
```

### Limpeza automática

Ao final, o teste remove todas as entidades criadas durante a execução, deixando o banco no estado original. Isso permite rodar os testes múltiplas vezes sem acumular dados de teste.

---

## Adicionando Novos Testes

Para adicionar um teste para uma nova funcionalidade:

1. Crie uma função `async function testMinhaFuncionalidade() { ... }`
2. Use `request(method, path, body)` para chamadas à API
3. Use `assert(condition, message)` para verificações
4. Adicione a chamada na função `run()` na ordem correta
5. Se criar entidades, adicione a limpeza na função `cleanup()`

Exemplo:

```typescript
async function testMinhaFuncionalidade() {
  console.log('\n🆕 MINHA FUNCIONALIDADE');

  const r1 = await request('POST', `/empresas/${EMPRESA_ID}/minha-rota`, { campo: 'valor' });
  assert(r1.ok, 'Criar registro');
  assert(r1.data.campo === 'valor', 'Campo retornado correto');

  const r2 = await request('GET', `/empresas/${EMPRESA_ID}/minha-rota`);
  assert(r2.ok && r2.data.length > 0, 'Listar registros');
}
```

---

## Integração com CI/CD

### GitHub Actions

Adicione ao `.github/workflows/test.yml`:

```yaml
name: QA Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: fluodelivery
          POSTGRES_USER: fluodelivery
          POSTGRES_PASSWORD: fluodelivery
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install backend
        working-directory: backend
        run: npm ci

      - name: Setup database
        working-directory: backend
        env:
          DATABASE_URL: postgresql://fluodelivery:fluodelivery@localhost:5432/fluodelivery
        run: |
          npx prisma db push
          npm run seed

      - name: Start backend
        working-directory: backend
        env:
          DATABASE_URL: postgresql://fluodelivery:fluodelivery@localhost:5432/fluodelivery
          JWT_SECRET: test-secret
          JWT_REFRESH_SECRET: test-refresh-secret
        run: npm run start:dev &

      - name: Wait for backend
        run: sleep 10

      - name: Run QA tests
        working-directory: backend
        run: npx ts-node test/e2e/qa-completo.ts
```
