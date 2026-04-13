// Plain type definitions (migrated from Supabase generated types)

// Row types - these match the API response shapes
export type Categoria = {
  id: string;
  empresa_id: string;
  nome: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
};

export type Produto = {
  id: string;
  empresa_id: string;
  nome: string;
  descricao: string | null;
  categoria_id: string | null;
  possui_variantes: boolean;
  preco_base: number | null;
  custo_base: number | null;
  imagem_url: string | null;
  ordem: number;
  ativo: boolean;
  created_at: string;
};

export type ProdutoVariante = {
  id: string;
  produto_id: string;
  empresa_id: string;
  nome: string;
  sku: string | null;
  custo: number;
  preco_venda: number;
  ordem: number;
  ativo: boolean;
  created_at: string;
};

export type AdicionaisGrupo = {
  id: string;
  empresa_id: string;
  nome: string;
  min_select: number;
  max_select: number;
  ativo: boolean;
  created_at: string;
};

export type AdicionaisItem = {
  id: string;
  grupo_id: string;
  empresa_id: string;
  nome: string;
  preco: number;
  ativo: boolean;
  created_at: string;
};

export type FormaPagamento = {
  id: string;
  empresa_id: string;
  nome: string;
  exige_troco: boolean;
  ativo: boolean;
  created_at: string;
};

export type Pedido = {
  id: string;
  empresa_id: string;
  numero_sequencial: number;
  cliente_nome: string;
  cliente_telefone: string | null;
  cliente_id: string | null;
  tipo: string;
  pedido_status: string;
  pagamento_status: string;
  endereco: Record<string, any> | null;
  subtotal: number;
  taxa_entrega: number;
  desconto: number;
  total: number;
  cupom_id: string | null;
  cupom_codigo: string | null;
  forma_pagamento_id: string | null;
  pagar_na_entrega: boolean;
  observacoes: string | null;
  mesa_id: string | null;
  conta_id: string | null;
  entregador_id: string | null;
  garcom_user_id: string | null;
  referencia: string | null;
  created_at: string;
};

export type PedidoItem = {
  id: string;
  pedido_id: string;
  empresa_id: string;
  produto_id: string;
  produto_variante_id: string | null;
  nome_snapshot: string;
  variante_nome_snapshot: string | null;
  preco_unit_snapshot: number;
  custo_unit_snapshot: number;
  qtd: number;
  observacao_item: string | null;
  created_at: string;
};

export type PedidoItemAdicional = {
  id: string;
  pedido_item_id: string;
  empresa_id: string;
  adicional_item_id: string;
  nome_snapshot: string;
  preco_snapshot: number;
  qtd: number;
};

export type UserRole = {
  id: string;
  user_id: string;
  empresa_id: string;
  role: AppRole;
  created_at: string;
};

// Insert types (Omit id and timestamps)
export type CategoriaInsert = Omit<Categoria, "id" | "created_at"> & { id?: string };
export type ProdutoInsert = Omit<Produto, "id" | "created_at"> & { id?: string };
export type ProdutoVarianteInsert = Omit<ProdutoVariante, "id" | "created_at"> & { id?: string };
export type AdicionaisGrupoInsert = Omit<AdicionaisGrupo, "id" | "created_at"> & { id?: string };
export type AdicionaisItemInsert = Omit<AdicionaisItem, "id" | "created_at"> & { id?: string };
export type FormaPagamentoInsert = Omit<FormaPagamento, "id" | "created_at"> & { id?: string };
export type PedidoInsert = Omit<Pedido, "id" | "created_at" | "numero_sequencial"> & { id?: string };
export type PedidoItemInsert = Omit<PedidoItem, "id" | "created_at"> & { id?: string };
export type PedidoItemAdicionalInsert = Omit<PedidoItemAdicional, "id"> & { id?: string };

// Update types (all fields optional except id)
export type CategoriaUpdate = Partial<Omit<Categoria, "id">> & { id?: string };
export type ProdutoUpdate = Partial<Omit<Produto, "id">> & { id?: string };
export type ProdutoVarianteUpdate = Partial<Omit<ProdutoVariante, "id">> & { id?: string };
export type AdicionaisGrupoUpdate = Partial<Omit<AdicionaisGrupo, "id">> & { id?: string };
export type AdicionaisItemUpdate = Partial<Omit<AdicionaisItem, "id">> & { id?: string };
export type FormaPagamentoUpdate = Partial<Omit<FormaPagamento, "id">> & { id?: string };
export type PedidoUpdate = Partial<Omit<Pedido, "id">> & { id?: string };

// Produto with relations
export type ProdutoWithRelations = Produto & {
  categorias?: Categoria | null;
  produto_variantes?: ProdutoVariante[];
};

// Produto ingrediente
export type ProdutoIngrediente = {
  id: string;
  empresa_id: string;
  produto_id: string;
  nome: string;
  removivel: boolean;
  ordem: number;
  ativo: boolean;
};

// Pedido with items
export type PedidoWithItems = Pedido & {
  pedido_itens?: (PedidoItem & {
    pedido_item_adicionais?: PedidoItemAdicional[];
  })[];
  formas_pagamento?: FormaPagamento | null;
};

export type Cliente = {
  id: string;
  empresa_id: string;
  nome: string;
  telefone: string;
  created_at: string;
  updated_at: string;
};
export type ClienteInsert = Omit<Cliente, "id" | "created_at" | "updated_at"> & { id?: string };
export type ClienteUpdate = Partial<Omit<Cliente, "id">> & { id?: string };

export type Mesa = {
  id: string;
  empresa_id: string;
  numero: number;
  nome: string;
  ativo: boolean;
  qr_code_token: string;
  created_at: string;
};
export type MesaInsert = Omit<Mesa, "id" | "created_at" | "qr_code_token"> & { id?: string; qr_code_token?: string };
export type MesaUpdate = Partial<Omit<Mesa, "id">> & { id?: string };

export type Conta = {
  id: string;
  empresa_id: string;
  tipo: string;
  mesa_id: string | null;
  referencia: string | null;
  status: string;
  total: number;
  fechada_em: string | null;
  created_at: string;
};
export type ContaInsert = Omit<Conta, "id" | "created_at"> & { id?: string };
export type ContaUpdate = Partial<Omit<Conta, "id">> & { id?: string };

export type ContaPagamento = {
  id: string;
  empresa_id: string;
  conta_id: string;
  forma_pagamento_id: string | null;
  valor: number;
  pessoa_label: string | null;
  created_at: string;
};
export type ContaPagamentoInsert = Omit<ContaPagamento, "id" | "created_at"> & { id?: string };

export type CaixaSessao = {
  id: string;
  empresa_id: string;
  status: string;
  valor_abertura: number;
  valor_fechamento: number | null;
  aberto_em: string;
  fechado_em: string | null;
  observacoes: string | null;
};
export type CaixaSessaoInsert = Omit<CaixaSessao, "id" | "aberto_em"> & { id?: string };
export type CaixaSessaoUpdate = Partial<Omit<CaixaSessao, "id">> & { id?: string };

export type CaixaRecebimento = {
  id: string;
  empresa_id: string;
  caixa_sessao_id: string;
  pedido_id: string | null;
  conta_id: string | null;
  forma_pagamento_id: string | null;
  valor: number;
  tipo_origem: string;
  motoboy_user_id: string | null;
  created_at: string;
};
export type CaixaRecebimentoInsert = Omit<CaixaRecebimento, "id" | "created_at"> & { id?: string };

export type MotoboyAcerto = {
  id: string;
  empresa_id: string;
  caixa_sessao_id: string | null;
  motoboy_user_id: string;
  total_coletado: number;
  total_devolvido: number;
  diferenca: number;
  created_at: string;
};
export type MotoboyAcertoInsert = Omit<MotoboyAcerto, "id" | "created_at"> & { id?: string };

// Dynamic string types (no longer fixed enums)
export type AppRole = "admin" | "atendente" | "cozinha" | "entregador" | "garcom";
export type PedidoStatus = string;
export type PagamentoStatus = "pendente" | "pago" | "estornado";
export type PedidoTipo = string;
