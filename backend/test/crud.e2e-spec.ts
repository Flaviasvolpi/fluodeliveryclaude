/**
 * Testes E2E - CRUD dos principais endpoints
 *
 * Roda contra o backend real (Docker na porta 3002).
 * Executa: npx jest --config test/jest-e2e.json crud.e2e-spec.ts
 */

const BASE = 'http://localhost:3002/api';

let token: string;
let empresaId: string;

// ---------- helpers ----------

async function post(path: string, body: Record<string, unknown>, auth = true) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

async function get(path: string, auth = true) {
  const headers: Record<string, string> = {};
  if (auth) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { headers });
  return { status: res.status, data: await res.json().catch(() => null) };
}

async function patch(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

async function del(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

// ---------- setup ----------

beforeAll(async () => {
  // Login com admin do seed
  const res = await post('/auth/login', {
    email: 'admin@fluodelivery.com',
    password: 'admin123',
  }, false);
  expect(res.status).toBe(201);
  token = res.data.access_token;

  // Pegar empresa
  const me = await get('/empresas/mine');
  expect(me.status).toBe(200);
  empresaId = me.data[0].id;
});

// ---------- AUTH ----------

describe('Auth', () => {
  it('POST /auth/login - retorna tokens', async () => {
    const res = await post('/auth/login', {
      email: 'admin@fluodelivery.com',
      password: 'admin123',
    }, false);
    expect(res.status).toBe(201);
    expect(res.data.access_token).toBeDefined();
    expect(res.data.refresh_token).toBeDefined();
  });

  it('POST /auth/login - senha errada retorna 401', async () => {
    const res = await post('/auth/login', {
      email: 'admin@fluodelivery.com',
      password: 'senhaerrada',
    }, false);
    expect(res.status).toBe(401);
  });

  it('GET /auth/me - retorna perfil autenticado', async () => {
    const res = await get('/auth/me');
    expect(res.status).toBe(200);
    expect(res.data.email).toBe('admin@fluodelivery.com');
    expect(res.data.roles).toBeDefined();
  });

  it('GET /auth/me - sem token retorna 401', async () => {
    const res = await get('/auth/me', false);
    expect(res.status).toBe(401);
  });
});

// ---------- CATEGORIAS ----------

describe('Categorias CRUD', () => {
  let categoriaId: string;

  it('POST - criar categoria', async () => {
    const res = await post(`/empresas/${empresaId}/categorias`, {
      nome: 'Bebidas Teste',
      ordem: 10,
    });
    expect(res.status).toBe(201);
    expect(res.data.id).toBeDefined();
    expect(res.data.nome).toBe('Bebidas Teste');
    categoriaId = res.data.id;
  });

  it('GET - listar categorias', async () => {
    const res = await get(`/empresas/${empresaId}/categorias`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.some((c: any) => c.id === categoriaId)).toBe(true);
  });

  it('PATCH - editar categoria', async () => {
    const res = await patch(`/empresas/${empresaId}/categorias/${categoriaId}`, {
      nome: 'Bebidas Editada',
    });
    expect(res.status).toBe(200);
    expect(res.data.nome).toBe('Bebidas Editada');
  });

  it('DELETE - remover categoria', async () => {
    const res = await del(`/empresas/${empresaId}/categorias/${categoriaId}`);
    expect(res.status).toBe(200);
    expect(res.data.id).toBe(categoriaId);
  });

  it('GET - categoria removida nao aparece na lista', async () => {
    const res = await get(`/empresas/${empresaId}/categorias`);
    expect(res.data.some((c: any) => c.id === categoriaId)).toBe(false);
  });
});

// ---------- PRODUTOS ----------

describe('Produtos CRUD', () => {
  let categoriaId: string;
  let produtoId: string;

  beforeAll(async () => {
    const cat = await post(`/empresas/${empresaId}/categorias`, {
      nome: 'Cat Produto Teste',
      ordem: 20,
    });
    categoriaId = cat.data.id;
  });

  afterAll(async () => {
    await del(`/empresas/${empresaId}/categorias/${categoriaId}`);
  });

  it('POST - criar produto', async () => {
    const res = await post(`/empresas/${empresaId}/produtos`, {
      nome: 'X-Bacon Teste',
      descricao: 'Hamburguer com bacon',
      categoriaId,
      ativo: true,
    });
    expect(res.status).toBe(201);
    expect(res.data.id).toBeDefined();
    expect(res.data.nome).toBe('X-Bacon Teste');
    produtoId = res.data.id;
  });

  it('GET - listar produtos', async () => {
    const res = await get(`/empresas/${empresaId}/produtos`);
    expect(res.status).toBe(200);
    expect(res.data.some((p: any) => p.id === produtoId)).toBe(true);
  });

  it('GET - buscar produto por ID', async () => {
    const res = await get(`/empresas/${empresaId}/produtos/${produtoId}`);
    expect(res.status).toBe(200);
    expect(res.data.nome).toBe('X-Bacon Teste');
  });

  it('PATCH - editar produto', async () => {
    const res = await patch(`/empresas/${empresaId}/produtos/${produtoId}`, {
      nome: 'X-Bacon Editado',
      descricao: 'Com bacon crocante',
    });
    expect(res.status).toBe(200);
    expect(res.data.nome).toBe('X-Bacon Editado');
  });

  it('DELETE - remover produto', async () => {
    const res = await del(`/empresas/${empresaId}/produtos/${produtoId}`);
    expect(res.status).toBe(200);
  });
});

// ---------- CLIENTES ----------

describe('Clientes CRUD', () => {
  let clienteId: string;

  it('POST - criar cliente', async () => {
    const tel = `119${Date.now().toString().slice(-8)}`;
    const res = await post(`/empresas/${empresaId}/clientes`, {
      nome: 'Maria Teste',
      telefone: tel,
    });
    expect(res.status).toBe(201);
    expect(res.data.id).toBeDefined();
    clienteId = res.data.id;
  });

  it('GET - listar clientes', async () => {
    const res = await get(`/empresas/${empresaId}/clientes`);
    expect(res.status).toBe(200);
    expect(res.data.some((c: any) => c.id === clienteId)).toBe(true);
  });

  it('GET - buscar cliente por ID', async () => {
    const res = await get(`/empresas/${empresaId}/clientes/${clienteId}`);
    expect(res.status).toBe(200);
    expect(res.data.nome).toBe('Maria Teste');
  });

  it('PATCH - editar cliente', async () => {
    const res = await patch(`/empresas/${empresaId}/clientes/${clienteId}`, {
      nome: 'Maria Editada',
    });
    expect(res.status).toBe(200);
    expect(res.data.nome).toBe('Maria Editada');
  });

  it('DELETE - remover cliente', async () => {
    const res = await del(`/empresas/${empresaId}/clientes/${clienteId}`);
    expect(res.status).toBe(200);
  });
});

// ---------- ENTREGADORES ----------

describe('Entregadores CRUD', () => {
  let entregadorId: string;

  it('POST - criar entregador', async () => {
    const res = await post(`/empresas/${empresaId}/entregadores`, {
      nome: 'Pedro Motoboy',
      telefone: '11977776666',
    });
    expect(res.status).toBe(201);
    expect(res.data.id).toBeDefined();
    entregadorId = res.data.id;
  });

  it('GET - listar entregadores', async () => {
    const res = await get(`/empresas/${empresaId}/entregadores`);
    expect(res.status).toBe(200);
    expect(res.data.some((e: any) => e.id === entregadorId)).toBe(true);
  });

  it('PATCH - editar entregador', async () => {
    const res = await patch(`/empresas/${empresaId}/entregadores/${entregadorId}`, {
      nome: 'Pedro Editado',
    });
    expect(res.status).toBe(200);
    expect(res.data.nome).toBe('Pedro Editado');
  });

  it('DELETE - remover entregador', async () => {
    const res = await del(`/empresas/${empresaId}/entregadores/${entregadorId}`);
    expect(res.status).toBe(200);
  });
});

// ---------- FORMAS DE PAGAMENTO ----------

describe('Formas de Pagamento CRUD', () => {
  let formaId: string;

  it('POST - criar forma de pagamento', async () => {
    const res = await post(`/empresas/${empresaId}/formas-pagamento`, {
      nome: 'Cheque Teste',
      ativo: true,
      exigeTroco: false,
    });
    expect(res.status).toBe(201);
    expect(res.data.id).toBeDefined();
    formaId = res.data.id;
  });

  it('GET - listar formas de pagamento', async () => {
    const res = await get(`/empresas/${empresaId}/formas-pagamento`);
    expect(res.status).toBe(200);
    expect(res.data.some((f: any) => f.id === formaId)).toBe(true);
  });

  it('PATCH - editar forma de pagamento', async () => {
    const res = await patch(`/empresas/${empresaId}/formas-pagamento/${formaId}`, {
      nome: 'Cheque Editado',
    });
    expect(res.status).toBe(200);
    expect(res.data.nome).toBe('Cheque Editado');
  });

  it('DELETE - remover forma de pagamento', async () => {
    const res = await del(`/empresas/${empresaId}/formas-pagamento/${formaId}`);
    expect(res.status).toBe(200);
  });
});

// ---------- MESAS ----------

describe('Mesas CRUD', () => {
  let mesaId: string;
  const mesaNumero = Math.floor(Math.random() * 9000) + 1000;

  it('POST - criar mesa', async () => {
    const res = await post(`/empresas/${empresaId}/mesas`, {
      nome: `Mesa ${mesaNumero}`,
      numero: mesaNumero,
    });
    expect(res.status).toBe(201);
    expect(res.data.id).toBeDefined();
    expect(res.data.qr_code_token).toBeDefined();
    mesaId = res.data.id;
  });

  it('GET - listar mesas', async () => {
    const res = await get(`/empresas/${empresaId}/mesas`);
    expect(res.status).toBe(200);
    expect(res.data.some((m: any) => m.id === mesaId)).toBe(true);
  });

  it('PATCH - editar mesa', async () => {
    const res = await patch(`/empresas/${empresaId}/mesas/${mesaId}`, {
      nome: 'Mesa Editada',
    });
    expect(res.status).toBe(200);
    expect(res.data.nome).toBe('Mesa Editada');
  });

  it('DELETE - remover mesa', async () => {
    const res = await del(`/empresas/${empresaId}/mesas/${mesaId}`);
    expect(res.status).toBe(200);
  });
});

// ---------- CUPONS ----------

describe('Cupons CRUD', () => {
  let cupomId: string;
  const codigo = `TST${Date.now().toString().slice(-6)}`;

  it('POST - criar cupom', async () => {
    const res = await post(`/empresas/${empresaId}/cupons`, {
      codigo,
      tipo: 'percentual',
      valor: 15,
      ativo: true,
    });
    expect(res.status).toBe(201);
    expect(res.data.id).toBeDefined();
    expect(res.data.codigo).toBe(codigo);
    cupomId = res.data.id;
  });

  it('GET - listar cupons', async () => {
    const res = await get(`/empresas/${empresaId}/cupons`);
    expect(res.status).toBe(200);
    expect(res.data.some((c: any) => c.id === cupomId)).toBe(true);
  });

  it('PATCH - editar cupom', async () => {
    const res = await patch(`/empresas/${empresaId}/cupons/${cupomId}`, {
      ativo: false,
    });
    expect(res.status).toBe(200);
    expect(res.data.ativo).toBe(false);
  });

  it('DELETE - remover cupom', async () => {
    const res = await del(`/empresas/${empresaId}/cupons/${cupomId}`);
    expect(res.status).toBe(200);
  });
});

// ---------- PEDIDOS ----------

describe('Pedidos - criar e atualizar status', () => {
  let pedidoId: string;
  let categoriaId: string;
  let produtoId: string;

  beforeAll(async () => {
    const cat = await post(`/empresas/${empresaId}/categorias`, {
      nome: 'Cat Pedido Teste',
      ordem: 30,
    });
    categoriaId = cat.data.id;

    const prod = await post(`/empresas/${empresaId}/produtos`, {
      nome: 'Produto Pedido Teste',
      categoriaId,
      ativo: true,
    });
    produtoId = prod.data.id;
  });

  afterAll(async () => {
    await del(`/empresas/${empresaId}/produtos/${produtoId}`);
    await del(`/empresas/${empresaId}/categorias/${categoriaId}`);
  });

  it('POST - criar pedido', async () => {
    const res = await post(`/empresas/${empresaId}/pedidos`, {
      clienteNome: 'Cliente Pedido Teste',
      clienteTelefone: '11900001111',
      tipo: 'retirada',
      subtotal: 30,
      itens: [
        {
          produtoId,
          nomeSnapshot: 'Produto Pedido Teste',
          precoUnitSnapshot: 30,
          qtd: 1,
        },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.data.numero_pedido).toBeDefined();

    // Buscar o pedido criado pelo numero_sequencial
    const numeroPedido = res.data.numero_pedido;
    const list = await get(`/empresas/${empresaId}/pedidos`);
    const pedido = list.data.find((p: any) => p.numero_sequencial === numeroPedido);
    expect(pedido).toBeDefined();
    pedidoId = pedido.id;
  });

  it('GET - listar pedidos', async () => {
    const res = await get(`/empresas/${empresaId}/pedidos`);
    expect(res.status).toBe(200);
    expect(res.data.length).toBeGreaterThan(0);
  });

  it('GET - buscar pedido por ID', async () => {
    const res = await get(`/empresas/${empresaId}/pedidos/${pedidoId}`);
    expect(res.status).toBe(200);
    expect(res.data.cliente_nome).toBe('Cliente Pedido Teste');
    expect(res.data.itens.length).toBe(1);
  });

  it('PATCH - atualizar status do pedido', async () => {
    const res = await patch(`/empresas/${empresaId}/pedidos/${pedidoId}/status`, {
      pedidoStatus: 'em_preparo',
    });
    expect(res.status).toBe(200);
    expect(res.data.pedido_status).toBe('em_preparo');
  });
});

// ---------- PROTEÇÃO DE ROTAS ----------

describe('Rotas protegidas sem token', () => {
  const routes = [
    '/empresas/mine',
    `/empresas/${empresaId || 'fake'}/categorias`,
    `/empresas/${empresaId || 'fake'}/produtos`,
    `/empresas/${empresaId || 'fake'}/clientes`,
    `/empresas/${empresaId || 'fake'}/pedidos`,
  ];

  it.each(routes)('GET %s - retorna 401 sem token', async (route) => {
    const res = await get(route, false);
    expect(res.status).toBe(401);
  });
});
