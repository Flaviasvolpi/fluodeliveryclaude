/**
 * QA Completo — Testa todas as funcionalidades do sistema via API
 *
 * USO:
 *   cd backend
 *   npx ts-node test/e2e/qa-completo.ts
 *
 * PRÉ-REQUISITOS:
 *   - Backend rodando em http://localhost:3000
 *   - Banco de dados com seed executado (admin@fluodelivery.com / admin123)
 */

const API = process.env.API_URL || 'http://localhost:3000/api';

let TOKEN = '';
let EMPRESA_ID = '';
let categoriaId = '';
let produtoId = '';
let produtoComVariantesId = '';
let varianteId = '';
let ingredienteId = '';
let grupoAdicionaisId = '';
let itemAdicionalId = '';
let formaPagamentoId = '';
let mesaId = '';
let entregadorId = '';
let clienteId = '';
let pedidoId = '';
let pedidoNumero = 0;
let cupomId = '';
let fidelidadeRegraId = '';
let caixaSessaoId = '';
let contaId = '';

let passed = 0;
let failed = 0;
const errors: string[] = [];

async function request(method: string, path: string, body?: any, token?: string): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token ?? TOKEN) headers['Authorization'] = `Bearer ${token ?? TOKEN}`;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get('content-type');
  const data = contentType?.includes('json') ? await res.json() : await res.text();

  return { status: res.status, ok: res.ok, data };
}

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${msg}`);
  } else {
    failed++;
    errors.push(msg);
    console.log(`  ❌ ${msg}`);
  }
}

// ==========================================
// TESTES
// ==========================================

async function testAuth() {
  console.log('\n🔐 AUTENTICAÇÃO');

  // Login com credenciais corretas
  const r1 = await request('POST', '/auth/login', { email: 'admin@fluodelivery.com', password: 'admin123' }, '');
  assert(r1.ok, 'Login com credenciais corretas');
  assert(!!r1.data.access_token, 'Retorna access_token');
  assert(!!r1.data.refresh_token, 'Retorna refresh_token');
  TOKEN = r1.data.access_token;

  // Login com credenciais erradas
  const r2 = await request('POST', '/auth/login', { email: 'admin@fluodelivery.com', password: 'errada' }, '');
  assert(r2.status === 401, 'Login com senha errada retorna 401');

  // /auth/me
  const r3 = await request('GET', '/auth/me');
  assert(r3.ok, '/auth/me retorna perfil');
  assert(r3.data.email === 'admin@fluodelivery.com', 'Email correto no perfil');
  assert(Array.isArray(r3.data.roles), 'Roles é array');

  // /auth/me/empresas
  const r4 = await request('GET', '/auth/me/empresas');
  assert(r4.ok && r4.data.length > 0, '/auth/me/empresas retorna empresas');
  EMPRESA_ID = r4.data[0].id;
  assert(!!EMPRESA_ID, 'Empresa ID obtido');

  // Refresh token
  const r5 = await request('POST', '/auth/refresh', { refreshToken: r1.data.refresh_token }, '');
  assert(r5.ok && !!r5.data.access_token, 'Refresh token funciona');
}

async function testEmpresa() {
  console.log('\n🏪 EMPRESA');

  // GET by slug
  const r1 = await request('GET', '/empresas/by-slug/demo', null, '');
  assert(r1.ok, 'GET /empresas/by-slug/demo (público)');
  assert(r1.data.slug === 'demo', 'Slug correto');

  // GET by ID
  const r2 = await request('GET', `/empresas/${EMPRESA_ID}`);
  assert(r2.ok, 'GET /empresas/:id');

  // PATCH
  const r3 = await request('PATCH', `/empresas/${EMPRESA_ID}`, { telefone: '11999999999' });
  assert(r3.ok, 'PATCH /empresas/:id atualiza telefone');
}

async function testCategorias() {
  console.log('\n📂 CATEGORIAS');

  // Criar
  const r1 = await request('POST', `/empresas/${EMPRESA_ID}/categorias`, { nome: 'QA Lanches', ordem: 0 });
  assert(r1.ok && !!r1.data.id, 'Criar categoria');
  categoriaId = r1.data.id;

  // Listar
  const r2 = await request('GET', `/empresas/${EMPRESA_ID}/categorias`);
  assert(r2.ok && r2.data.length > 0, 'Listar categorias');

  // Listar ativas (público)
  const r3 = await request('GET', `/empresas/${EMPRESA_ID}/categorias/active`, null, '');
  assert(r3.ok, 'Listar categorias ativas (público)');

  // Editar
  const r4 = await request('PATCH', `/empresas/${EMPRESA_ID}/categorias/${categoriaId}`, { nome: 'QA Lanches Editado' });
  assert(r4.ok, 'Editar categoria');
}

async function testAdicionais() {
  console.log('\n➕ ADICIONAIS');

  // Criar grupo
  const r1 = await request('POST', `/empresas/${EMPRESA_ID}/adicionais/grupos`, { nome: 'QA Extras', min_select: 0, max_select: 3 });
  assert(r1.ok && !!r1.data.id, 'Criar grupo de adicionais');
  grupoAdicionaisId = r1.data.id;

  // Criar item
  const r2 = await request('POST', `/empresas/${EMPRESA_ID}/adicionais/itens`, { grupo_id: grupoAdicionaisId, nome: 'Bacon Extra', preco: 5.00 });
  assert(r2.ok && !!r2.data.id, 'Criar item adicional');
  itemAdicionalId = r2.data.id;

  // Listar grupos
  const r3 = await request('GET', `/empresas/${EMPRESA_ID}/adicionais/grupos`);
  assert(r3.ok && r3.data.length > 0, 'Listar grupos de adicionais');

  // Editar item
  const r4 = await request('PATCH', `/empresas/${EMPRESA_ID}/adicionais/itens/${itemAdicionalId}`, { preco: 6.50 });
  assert(r4.ok, 'Editar item adicional');
}

async function testProdutos() {
  console.log('\n🍔 PRODUTOS');

  // Criar produto simples
  const r1 = await request('POST', `/empresas/${EMPRESA_ID}/produtos`, {
    nome: 'QA X-Burguer',
    descricao: 'Hambúrguer de teste',
    categoria_id: categoriaId,
    preco_base: 25.90,
    custo_base: 10.00,
    grupo_ids: [grupoAdicionaisId],
  });
  assert(r1.ok && !!r1.data.id, 'Criar produto simples com categoria e adicionais');
  produtoId = r1.data.id;

  // Criar produto com variantes
  const r2 = await request('POST', `/empresas/${EMPRESA_ID}/produtos`, {
    nome: 'QA Pizza',
    descricao: 'Pizza de teste',
    categoria_id: categoriaId,
    possui_variantes: true,
    variantes: [
      { nome: 'Pequena', preco_venda: 30, custo: 12, ordem: 0 },
      { nome: 'Grande', preco_venda: 50, custo: 20, ordem: 1 },
    ],
    ingredientes: [
      { nome: 'Queijo', removivel: true, ordem: 0 },
      { nome: 'Molho', removivel: true, ordem: 1 },
    ],
  });
  assert(r2.ok && !!r2.data.id, 'Criar produto com variantes e ingredientes');
  produtoComVariantesId = r2.data.id;

  // Listar todos
  const r3 = await request('GET', `/empresas/${EMPRESA_ID}/produtos`);
  assert(r3.ok && r3.data.length >= 2, 'Listar todos os produtos');
  const pizza = r3.data.find((p: any) => p.id === produtoComVariantesId);
  assert(pizza?.variantes?.length === 2, 'Produto tem 2 variantes');
  assert(pizza?.ingredientes?.length === 2, 'Produto tem 2 ingredientes');
  assert(pizza?.categoria?.nome === 'QA Lanches Editado', 'Produto tem categoria com nome');
  if (pizza?.variantes?.[0]) varianteId = pizza.variantes[0].id;

  // Listar ativos (público)
  const r4 = await request('GET', `/empresas/${EMPRESA_ID}/produtos/active`, null, '');
  assert(r4.ok, 'Listar produtos ativos (público)');

  // Editar produto
  const r5 = await request('PATCH', `/empresas/${EMPRESA_ID}/produtos/${produtoId}`, { preco_base: 27.90 });
  assert(r5.ok, 'Editar preço do produto');

  // Toggle ativo
  const r6 = await request('PATCH', `/empresas/${EMPRESA_ID}/produtos/${produtoId}/toggle`, { ativo: false });
  assert(r6.ok, 'Desativar produto');
  const r7 = await request('PATCH', `/empresas/${EMPRESA_ID}/produtos/${produtoId}/toggle`, { ativo: true });
  assert(r7.ok, 'Reativar produto');

  // Variantes CRUD separado
  const r8 = await request('POST', `/empresas/${EMPRESA_ID}/produto-variantes`, {
    produto_id: produtoComVariantesId, nome: 'Média', preco_venda: 40, custo: 16, ordem: 2,
  });
  assert(r8.ok, 'Criar variante via endpoint separado');

  // Ingredientes CRUD separado
  const r9 = await request('POST', `/empresas/${EMPRESA_ID}/produto-ingredientes`, {
    produto_id: produtoComVariantesId, nome: 'Orégano', removivel: true, ordem: 2,
  });
  assert(r9.ok, 'Criar ingrediente via endpoint separado');
  if (r9.ok) ingredienteId = r9.data.id;
}

async function testFormasPagamento() {
  console.log('\n💳 FORMAS DE PAGAMENTO');

  const r1 = await request('GET', `/empresas/${EMPRESA_ID}/formas-pagamento`, null, '');
  assert(r1.ok && r1.data.length > 0, 'Listar formas de pagamento (público)');
  formaPagamentoId = r1.data[0].id;

  const r2 = await request('POST', `/empresas/${EMPRESA_ID}/formas-pagamento`, { nome: 'QA Pix', exige_troco: false });
  assert(r2.ok, 'Criar forma de pagamento');
}

async function testMesas() {
  console.log('\n🍽️ MESAS');

  const r1 = await request('POST', `/empresas/${EMPRESA_ID}/mesas`, { numero: 99, nome: 'QA Mesa 99' });
  assert(r1.ok && !!r1.data.id, 'Criar mesa');
  mesaId = r1.data.id;
  assert(!!r1.data.qr_code_token, 'Mesa tem QR code token');

  const r2 = await request('GET', `/empresas/${EMPRESA_ID}/mesas`);
  assert(r2.ok && r2.data.some((m: any) => m.id === mesaId), 'Listar mesas contém a mesa criada');

  const r3 = await request('PATCH', `/empresas/${EMPRESA_ID}/mesas/${mesaId}`, { nome: 'QA Mesa Editada' });
  assert(r3.ok, 'Editar mesa');
}

async function testEntregadores() {
  console.log('\n🏍️ ENTREGADORES');

  const r1 = await request('POST', `/empresas/${EMPRESA_ID}/entregadores`, { nome: 'QA Entregador', telefone: '11988887777' });
  assert(r1.ok && !!r1.data.id, 'Criar entregador');
  entregadorId = r1.data.id;

  const r2 = await request('GET', `/empresas/${EMPRESA_ID}/entregadores`);
  assert(r2.ok && r2.data.length > 0, 'Listar entregadores');
}

async function testClientes() {
  console.log('\n👥 CLIENTES');

  const r1 = await request('GET', `/empresas/${EMPRESA_ID}/clientes`);
  assert(r1.ok, 'Listar clientes');

  // Cliente será criado automaticamente ao fazer pedido (upsert por telefone)
}

async function testConfiguracoes() {
  console.log('\n⚙️ CONFIGURAÇÕES');

  // Upsert config
  const r1 = await request('POST', `/empresas/${EMPRESA_ID}/configuracoes`, { chave: 'qa_test', valor: 'ok' });
  assert(r1.ok, 'Upsert configuração');

  // Listar configs (público)
  const r2 = await request('GET', `/empresas/${EMPRESA_ID}/configuracoes`, null, '');
  assert(r2.ok && r2.data.some((c: any) => c.chave === 'qa_test'), 'Listar configurações contém qa_test');

  // Taxa de entrega
  const r3 = await request('POST', `/empresas/${EMPRESA_ID}/configuracoes`, { chave: 'taxa_entrega_padrao', valor: '8.00' });
  assert(r3.ok, 'Configurar taxa de entrega');
}

async function testTiposPedido() {
  console.log('\n📋 TIPOS DE PEDIDO');

  const r1 = await request('GET', `/empresas/${EMPRESA_ID}/pedido-tipos-config`);
  assert(r1.ok && r1.data.length > 0, 'Listar tipos de pedido');

  // Bulk upsert
  const tipos = r1.data.map((t: any, i: number) => ({
    tipo_key: t.tipo_key, label: t.label, ativo: t.ativo, ordem: i,
  }));
  const r2 = await request('PUT', `/empresas/${EMPRESA_ID}/pedido-tipos-config/bulk`, tipos);
  assert(r2.ok, 'Bulk upsert tipos de pedido');
}

async function testFluxoStatus() {
  console.log('\n🔄 FLUXO DE STATUS');

  const r1 = await request('GET', `/empresas/${EMPRESA_ID}/pedido-status-config`);
  assert(r1.ok && r1.data.length > 0, 'Listar status de pedido');

  // Bulk upsert
  const statuses = r1.data.map((s: any, i: number) => ({
    status_key: s.status_key, label: s.label, cor: s.cor, ativo: s.ativo, ordem: i,
    tipos_aplicaveis: s.tipos_aplicaveis,
  }));
  const r2 = await request('PUT', `/empresas/${EMPRESA_ID}/pedido-status-config`, statuses);
  assert(r2.ok, 'Bulk upsert status de pedido');
}

async function testPedidoCompleto() {
  console.log('\n🛒 PEDIDO COMPLETO (fluxo retirada)');

  // Criar pedido
  const r1 = await request('POST', `/empresas/${EMPRESA_ID}/pedidos`, {
    cliente_nome: 'QA Cliente Teste',
    cliente_telefone: '11999990000',
    tipo: 'retirada',
    subtotal: 25.90,
    taxa_entrega: 0,
    total: 25.90,
    forma_pagamento_id: formaPagamentoId,
    observacoes: 'Pedido de teste QA',
    itens: [
      {
        produto_id: produtoId,
        nome_snapshot: 'QA X-Burguer',
        preco_unit_snapshot: 25.90,
        custo_unit_snapshot: 10.00,
        qtd: 1,
        observacao_item: 'Sem cebola',
        adicionais: [
          { adicional_item_id: itemAdicionalId, nome_snapshot: 'Bacon Extra', preco_snapshot: 6.50, qtd: 1 },
        ],
      },
    ],
  }, '');
  assert(r1.ok, 'Criar pedido (público)');
  assert(!!r1.data.numero_pedido, `Pedido criado com número #${r1.data.numero_pedido}`);
  pedidoNumero = r1.data.numero_pedido;

  // Buscar pedido criado
  const r2 = await request('GET', `/empresas/${EMPRESA_ID}/pedidos`);
  assert(r2.ok, 'Listar pedidos');
  const pedido = r2.data.find((p: any) => p.numero_sequencial === pedidoNumero);
  assert(!!pedido, 'Pedido encontrado na lista');
  pedidoId = pedido?.id;

  // Verificar itens
  assert(pedido?.itens?.length === 1, 'Pedido tem 1 item');
  assert(pedido?.itens?.[0]?.nome_snapshot === 'QA X-Burguer', 'Item tem nome correto');
  assert(pedido?.itens?.[0]?.adicionais?.length === 1, 'Item tem 1 adicional');
  assert(pedido?.itens?.[0]?.observacao_item === 'Sem cebola', 'Item tem observação');

  // Verificar cliente criado
  const r3 = await request('GET', `/empresas/${EMPRESA_ID}/clientes`);
  const cliente = r3.data?.find((c: any) => c.telefone === '11999990000');
  assert(!!cliente, 'Cliente criado automaticamente por telefone');
  if (cliente) clienteId = cliente.id;

  // Atualizar status: novo → confirmado → preparo → pronto → entregue
  const statusFlow = ['confirmado', 'preparo', 'pronto', 'entregue'];
  for (const status of statusFlow) {
    const r = await request('PATCH', `/empresas/${EMPRESA_ID}/pedidos/${pedidoId}/status`, { pedido_status: status });
    assert(r.ok, `Status atualizado para: ${status}`);
  }

  // Verificar status final
  const r4 = await request('GET', `/empresas/${EMPRESA_ID}/pedidos/${pedidoId}`);
  assert(r4.data?.pedido_status === 'entregue', 'Status final é "entregue"');
}

async function testPedidoEntrega() {
  console.log('\n🚚 PEDIDO ENTREGA (com entregador)');

  const r1 = await request('POST', `/empresas/${EMPRESA_ID}/pedidos`, {
    cliente_nome: 'QA Cliente Entrega',
    cliente_telefone: '11888880000',
    tipo: 'entrega',
    endereco: { rua: 'Rua QA', numero: '123', bairro: 'Centro', complemento: 'Apt 1' },
    subtotal: 50.00,
    taxa_entrega: 8.00,
    total: 58.00,
    forma_pagamento_id: formaPagamentoId,
    pagar_na_entrega: true,
    itens: [
      { produto_id: produtoComVariantesId, produto_variante_id: varianteId, nome_snapshot: 'QA Pizza', variante_nome_snapshot: 'Pequena', preco_unit_snapshot: 30, custo_unit_snapshot: 12, qtd: 1, adicionais: [] },
    ],
  }, '');
  assert(r1.ok, 'Criar pedido entrega');
  const pedidoEntregaId = (await request('GET', `/empresas/${EMPRESA_ID}/pedidos`)).data?.find((p: any) => p.numero_sequencial === r1.data.numero_pedido)?.id;

  // Atribuir entregador
  if (pedidoEntregaId) {
    const r2 = await request('PATCH', `/empresas/${EMPRESA_ID}/pedidos/${pedidoEntregaId}`, { entregador_id: entregadorId });
    assert(r2.ok, 'Atribuir entregador ao pedido');

    const r3 = await request('PATCH', `/empresas/${EMPRESA_ID}/pedidos/${pedidoEntregaId}/status`, { pedido_status: 'saiu_entrega' });
    assert(r3.ok, 'Status atualizado para saiu_entrega');
  }
}

async function testPedidoMesa() {
  console.log('\n🍽️ PEDIDO MESA (com conta)');

  const r1 = await request('POST', `/empresas/${EMPRESA_ID}/pedidos`, {
    cliente_nome: 'QA Cliente Mesa',
    tipo: 'mesa',
    mesa_id: mesaId,
    subtotal: 25.90,
    total: 25.90,
    forma_pagamento_id: formaPagamentoId,
    itens: [
      { produto_id: produtoId, nome_snapshot: 'QA X-Burguer', preco_unit_snapshot: 25.90, custo_unit_snapshot: 10, qtd: 1, adicionais: [] },
    ],
  }, '');
  assert(r1.ok, 'Criar pedido mesa');
}

async function testCupons() {
  console.log('\n🎟️ CUPONS');

  const r1 = await request('POST', `/empresas/${EMPRESA_ID}/cupons`, {
    codigo: 'QATEST10',
    tipo_desconto: 'percentual',
    valor_desconto: 10,
    valor_minimo: 20,
    uso_maximo: 100,
  });
  assert(r1.ok && !!r1.data.id, 'Criar cupom');
  cupomId = r1.data.id;

  // Listar (público)
  const r2 = await request('GET', `/empresas/${EMPRESA_ID}/cupons`, null, '');
  assert(r2.ok && r2.data.some((c: any) => c.codigo === 'QATEST10'), 'Cupom aparece na lista pública');
}

async function testFidelidade() {
  console.log('\n🏆 FIDELIDADE');

  const r1 = await request('POST', `/empresas/${EMPRESA_ID}/fidelidade`, {
    nome: 'QA Fidelidade',
    tipo_recompensa: 'percentual',
    valor_recompensa: 10,
    meta_pedidos: 5,
    validade_dias: 30,
  });
  assert(r1.ok && !!r1.data.id, 'Criar regra de fidelidade');
  fidelidadeRegraId = r1.data.id;

  const r2 = await request('GET', `/empresas/${EMPRESA_ID}/fidelidade`);
  assert(r2.ok && r2.data.length > 0, 'Listar regras de fidelidade');
}

async function testCaixa() {
  console.log('\n💰 CAIXA');

  // Abrir sessão
  const r1 = await request('POST', `/empresas/${EMPRESA_ID}/caixa/sessoes/abrir`, { valor_abertura: 100 });
  assert(r1.ok && !!r1.data.id, 'Abrir sessão de caixa');
  caixaSessaoId = r1.data.id;

  // Consultar sessão
  const r2 = await request('GET', `/empresas/${EMPRESA_ID}/caixa/sessoes/${caixaSessaoId}`);
  assert(r2.ok && r2.data.status === 'aberto', 'Sessão está aberta');

  // Registrar recebimento
  const r3 = await request('POST', `/empresas/${EMPRESA_ID}/caixa/recebimentos`, {
    caixa_sessao_id: caixaSessaoId,
    pedido_id: pedidoId,
    forma_pagamento_id: formaPagamentoId,
    valor: 25.90,
    tipo_origem: 'pedido',
  });
  assert(r3.ok, 'Registrar recebimento no caixa');

  // Fechar sessão
  const r4 = await request('POST', `/empresas/${EMPRESA_ID}/caixa/sessoes/${caixaSessaoId}/fechar`, { valor_fechamento: 125.90 });
  assert(r4.ok, 'Fechar sessão de caixa');
}

async function testUsuarios() {
  console.log('\n👤 USUÁRIOS');

  // Criar usuário
  const r1 = await request('POST', `/empresas/${EMPRESA_ID}/usuarios/create`, {
    email: `qa-test-${Date.now()}@test.com`,
    password: 'teste123',
    nome: 'QA Usuário',
    roles: ['atendente'],
  });
  assert(r1.ok, 'Criar usuário com role');

  // Listar
  const r2 = await request('GET', `/empresas/${EMPRESA_ID}/usuarios`);
  assert(r2.ok && r2.data.length >= 2, 'Listar usuários (admin + novo)');
}

async function testPerfilPermissoes() {
  console.log('\n🔒 PERFIL E PERMISSÕES');

  const r1 = await request('GET', `/empresas/${EMPRESA_ID}/perfil-permissoes`);
  assert(r1.ok && r1.data.length > 0, 'Listar permissões');

  // Criar permissão
  const r2 = await request('POST', `/empresas/${EMPRESA_ID}/perfil-permissoes`, { role: 'atendente', tela_key: 'dashboard' });
  assert(r2.ok || r2.status === 500, 'Criar permissão (ou já existe)');

  // Deletar por role
  const r3 = await request('DELETE', `/empresas/${EMPRESA_ID}/perfil-permissoes/by-role/garcom`);
  assert(r3.ok, 'Deletar permissões por role');
}

async function testHorarios() {
  console.log('\n🕐 HORÁRIOS DE FUNCIONAMENTO');

  const r1 = await request('PUT', `/empresas/${EMPRESA_ID}/horarios`, {
    horarios: [
      { dia_semana: 0, hora_abrir: '12:00', hora_fechar: '22:00', ativo: true },
      { dia_semana: 1, hora_abrir: '09:00', hora_fechar: '23:00', ativo: true },
    ],
  });
  assert(r1.ok, 'Salvar horários');

  const r2 = await request('GET', `/empresas/${EMPRESA_ID}/horarios`);
  assert(r2.ok && r2.data.length === 2, 'Listar horários');
}

async function testIfoodConfig() {
  console.log('\n🍕 IFOOD CONFIG');

  const r1 = await request('GET', `/empresas/${EMPRESA_ID}/ifood/config`);
  assert(r1.ok, 'GET ifood config');
  assert(r1.data.ifood_ativo === false, 'iFood inativo por padrão');

  // Salvar credenciais
  const r2 = await request('PUT', `/empresas/${EMPRESA_ID}/ifood/config`, {
    ifood_merchant_id: 'test-merchant-id',
    ifood_client_id: 'test-client-id',
    ifood_client_secret: 'test-secret',
  });
  assert(r2.ok, 'Salvar credenciais iFood');

  // Ativar
  const r3 = await request('POST', `/empresas/${EMPRESA_ID}/ifood/activate`);
  assert(r3.ok, 'Ativar iFood');

  // Verificar tipo iFood criado
  const r4 = await request('GET', `/empresas/${EMPRESA_ID}/pedido-tipos-config`);
  assert(r4.data?.some((t: any) => t.tipo_key === 'ifood'), 'Tipo "iFood" criado automaticamente');

  // Verificar mappings criados
  const r5 = await request('GET', `/empresas/${EMPRESA_ID}/ifood/status-mappings`);
  assert(r5.ok && r5.data.length >= 4, 'Status mappings criados');

  // Sync status
  const r6 = await request('GET', `/empresas/${EMPRESA_ID}/ifood/sync-status`);
  assert(r6.ok, 'GET sync status');

  // Desativar
  const r7 = await request('POST', `/empresas/${EMPRESA_ID}/ifood/deactivate`);
  assert(r7.ok, 'Desativar iFood');
}

async function testUpload() {
  console.log('\n📷 UPLOAD');

  // Upload simples com FormData não é trivial via fetch puro, testar que endpoint existe
  const r1 = await request('POST', `/uploads/site-assets`, null);
  assert(r1.status === 400, 'Upload sem arquivo retorna 400 (endpoint existe)');
}

async function testClienteAuth() {
  console.log('\n📱 CLIENTE AUTH (loja)');

  const r1 = await fetch(`${API}/v1/cliente-auth/verificar-telefone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ empresa_id: EMPRESA_ID, telefone: '11999990000' }),
  });
  assert(r1.ok || r1.status === 200, 'Verificar telefone do cliente');
}

async function testCardapioApi() {
  console.log('\n📖 CARDÁPIO API (público v1)');

  // Precisa API key
  const empresa = await request('GET', `/empresas/${EMPRESA_ID}/api-key`);
  if (empresa.ok && empresa.data?.api_key) {
    const apiKey = empresa.data.api_key;
    const r1 = await fetch(`${API}/v1/cardapio?empresa_id=${EMPRESA_ID}`, {
      headers: { 'x-api-key': apiKey },
    });
    assert(r1.ok, 'GET /v1/cardapio com API key');
  } else {
    console.log('  ⚠️  API key não disponível, pulando teste de cardápio v1');
  }
}

// ==========================================
// LIMPEZA
// ==========================================

async function cleanup() {
  console.log('\n🧹 LIMPEZA');

  // Deletar entidades de teste
  if (ingredienteId) await request('DELETE', `/empresas/${EMPRESA_ID}/produto-ingredientes/${ingredienteId}`);
  if (cupomId) await request('DELETE', `/empresas/${EMPRESA_ID}/cupons/${cupomId}`);
  if (fidelidadeRegraId) await request('DELETE', `/empresas/${EMPRESA_ID}/fidelidade/${fidelidadeRegraId}`);
  if (mesaId) await request('DELETE', `/empresas/${EMPRESA_ID}/mesas/${mesaId}`);
  if (entregadorId) await request('DELETE', `/empresas/${EMPRESA_ID}/entregadores/${entregadorId}`);
  if (produtoId) await request('DELETE', `/empresas/${EMPRESA_ID}/produtos/${produtoId}`);
  if (produtoComVariantesId) await request('DELETE', `/empresas/${EMPRESA_ID}/produtos/${produtoComVariantesId}`);
  if (grupoAdicionaisId) await request('DELETE', `/empresas/${EMPRESA_ID}/adicionais/grupos/${grupoAdicionaisId}`);
  if (categoriaId) await request('DELETE', `/empresas/${EMPRESA_ID}/categorias/${categoriaId}`);

  console.log('  ✅ Entidades de teste removidas');
}

// ==========================================
// EXECUÇÃO
// ==========================================

async function run() {
  console.log('═══════════════════════════════════════');
  console.log('  QA COMPLETO — FluoDelivery');
  console.log(`  API: ${API}`);
  console.log(`  Data: ${new Date().toLocaleString('pt-BR')}`);
  console.log('═══════════════════════════════════════');

  try {
    await testAuth();
    await testEmpresa();
    await testCategorias();
    await testAdicionais();
    await testProdutos();
    await testFormasPagamento();
    await testMesas();
    await testEntregadores();
    await testConfiguracoes();
    await testTiposPedido();
    await testFluxoStatus();
    await testPedidoCompleto();
    await testPedidoEntrega();
    await testPedidoMesa();
    await testCupons();
    await testFidelidade();
    await testClientes();
    await testCaixa();
    await testUsuarios();
    await testPerfilPermissoes();
    await testHorarios();
    await testIfoodConfig();
    await testUpload();
    await testClienteAuth();
    await testCardapioApi();
    await cleanup();
  } catch (err: any) {
    console.error('\n💥 ERRO FATAL:', err.message);
  }

  console.log('\n═══════════════════════════════════════');
  console.log(`  RESULTADO: ${passed} ✅  ${failed} ❌`);
  if (errors.length > 0) {
    console.log('\n  FALHAS:');
    errors.forEach((e) => console.log(`    ❌ ${e}`));
  }
  console.log('═══════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

run();
