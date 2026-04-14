import AdminLayout from "@/components/layout/AdminLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ShoppingBag, Truck, DollarSign, Users, Package, Settings, BookOpen, ExternalLink } from "lucide-react";

interface HelpTopic {
  title: string;
  description: string;
  steps: string[];
}

interface HelpSection {
  label: string;
  icon: React.ElementType;
  topics: HelpTopic[];
}

const helpSections: HelpSection[] = [
  {
    label: "Vendas",
    icon: ShoppingBag,
    topics: [
      {
        title: "Atendimento",
        description: "Tela principal para criar e gerenciar pedidos em tempo real.",
        steps: [
          "Acesse o menu Vendas > Atendimento.",
          "Clique em 'Novo Pedido' para iniciar um atendimento.",
          "Selecione o tipo de pedido (balcão, mesa, delivery, etc.).",
          "Adicione os produtos ao pedido, ajustando quantidade e adicionais.",
          "Informe o cliente (ou cadastre um novo) e a forma de pagamento.",
          "Confirme o pedido. Ele aparecerá na lista e será enviado à cozinha automaticamente.",
        ],
      },
      {
        title: "Pedidos",
        description: "Visualize e gerencie todos os pedidos realizados.",
        steps: [
          "Acesse Vendas > Pedidos para ver a lista completa.",
          "Use os filtros por status, tipo ou data para encontrar pedidos específicos.",
          "Clique em um pedido para ver os detalhes (itens, valores, cliente).",
          "Altere o status do pedido conforme o fluxo configurado (ex: preparando → pronto → entregue).",
          "Você pode cancelar ou editar pedidos conforme necessário.",
        ],
      },
      {
        title: "Cozinha",
        description: "Painel exclusivo para a equipe de produção acompanhar os pedidos.",
        steps: [
          "Acesse Vendas > Cozinha.",
          "Os pedidos aparecem em cards organizados por ordem de chegada.",
          "A cozinha visualiza apenas os itens a preparar, sem informações de pagamento.",
          "Ao finalizar o preparo, marque o pedido como 'Pronto' para notificar o atendimento.",
        ],
      },
    ],
  },
  {
    label: "Entregas",
    icon: Truck,
    topics: [
      {
        title: "Gestão de Entregas",
        description: "Acompanhe e gerencie as entregas em andamento.",
        steps: [
          "Acesse Entregas > Gestão Entregas.",
          "Veja todos os pedidos do tipo delivery e seus status.",
          "Atribua um entregador a cada pedido clicando no botão de seleção.",
          "Acompanhe o status da entrega (saiu para entrega, entregue, etc.).",
        ],
      },
      {
        title: "Acerto Entregador",
        description: "Faça o acerto financeiro com os entregadores ao final do expediente.",
        steps: [
          "Acesse Entregas > Acerto Entregador.",
          "Selecione o entregador para ver as entregas realizadas.",
          "Confira os valores coletados pelo entregador (dinheiro, cartão, etc.).",
          "Registre o valor devolvido e finalize o acerto.",
        ],
      },
    ],
  },
  {
    label: "Financeiro",
    icon: DollarSign,
    topics: [
      {
        title: "Caixa",
        description: "Controle a abertura e fechamento do caixa diário.",
        steps: [
          "Acesse Financeiro > Caixa.",
          "Abra o caixa informando o valor inicial (troco).",
          "Durante o dia, todos os recebimentos são registrados automaticamente.",
          "Ao final do expediente, feche o caixa para gerar o resumo do dia.",
          "Confira o total por forma de pagamento e a diferença (sobra/falta).",
        ],
      },
      {
        title: "Fechar Conta",
        description: "Encerre contas de mesa ou comanda com pagamento parcial ou total.",
        steps: [
          "Acesse Financeiro > Fechar Conta.",
          "Selecione a conta/mesa que deseja encerrar.",
          "Veja o resumo dos pedidos vinculados à conta.",
          "Registre o pagamento (pode dividir entre várias formas de pagamento).",
          "Finalize a conta para liberar a mesa.",
        ],
      },
      {
        title: "Pagamentos",
        description: "Configure as formas de pagamento aceitas pela empresa.",
        steps: [
          "Acesse Financeiro > Pagamentos.",
          "Adicione formas de pagamento (Dinheiro, PIX, Cartão, etc.).",
          "Marque se a forma exige troco (ex: Dinheiro).",
          "Ative ou desative formas de pagamento conforme necessário.",
        ],
      },
      {
        title: "Margem de Lucro",
        description: "Visualize a margem de lucro de cada produto com base no custo e preço de venda cadastrados.",
        steps: [
          "Acesse Financeiro > Margem de Lucro.",
          "Veja a tabela com todos os produtos ativos e suas margens.",
          "Produtos com variantes exibem uma linha por variante.",
          "As margens são classificadas por cor: verde (>30%), amarelo (15-30%) e vermelho (<15%).",
          "Os cards de resumo mostram margem média, produto mais lucrativo e menor margem.",
          "Produtos sem custo cadastrado aparecem em cinza — cadastre o custo na tela de Produtos.",
        ],
      },
      {
        title: "Vendas",
        description: "Acompanhe o desempenho de vendas com filtros de período e ranking de produtos.",
        steps: [
          "Acesse Financeiro > Vendas.",
          "Use os filtros de período (Hoje, 7 dias, 30 dias ou personalizado).",
          "Os cards de resumo mostram pedidos, faturamento, ticket médio e itens vendidos.",
          "A tabela mostra o ranking dos produtos mais vendidos no período selecionado.",
          "Os primeiros 5 produtos aparecem diretamente; clique em 'Ver mais' para expandir.",
        ],
      },
      {
        title: "Lucratividade",
        description: "Analise o lucro real gerado pelas vendas com base nos itens vendidos.",
        steps: [
          "Acesse Financeiro > Lucratividade.",
          "Use os filtros de período (Hoje, 7 dias, 30 dias ou personalizado).",
          "Os cards de resumo mostram faturamento total, custo total, lucro, margem e itens vendidos.",
          "A tabela detalha cada produto vendido com quantidade, faturamento, custo, lucro e margem.",
          "A coluna '% Lucro' mostra a participação de cada produto no lucro total.",
          "Os dados são baseados nos valores registrados no momento da venda (snapshots).",
        ],
      },
    ],
  },
  {
    label: "Clientes",
    icon: Users,
    topics: [
      {
        title: "Clientes",
        description: "Gerencie a base de clientes da sua empresa.",
        steps: [
          "Acesse Clientes > Clientes.",
          "Veja a lista de todos os clientes cadastrados.",
          "Clique em um cliente para ver detalhes, endereços e histórico de pedidos.",
          "Edite os dados do cliente ou adicione novos endereços.",
          "Clientes são cadastrados automaticamente ao fazer pedidos, ou manualmente.",
        ],
      },
      {
        title: "Fidelidade",
        description: "Configure regras de fidelidade para recompensar clientes frequentes.",
        steps: [
          "Acesse Clientes > Fidelidade.",
          "Crie uma regra definindo a meta de pedidos para ganhar recompensa.",
          "Escolha o tipo de recompensa (desconto fixo ou percentual).",
          "Defina o valor e a validade do cupom gerado.",
          "Quando o cliente atingir a meta, um cupom será gerado automaticamente.",
        ],
      },
      {
        title: "Cupons",
        description: "Crie e gerencie cupons de desconto.",
        steps: [
          "Acesse Clientes > Cupons.",
          "Crie cupons com código, tipo de desconto e valor.",
          "Defina valor mínimo de pedido e limite de usos.",
          "Vincule cupons a clientes específicos ou deixe público.",
          "Acompanhe quantas vezes cada cupom foi utilizado.",
        ],
      },
    ],
  },
  {
    label: "Catálogo",
    icon: Package,
    topics: [
      {
        title: "Categorias",
        description: "Organize seus produtos em categorias para o cardápio.",
        steps: [
          "Acesse Catálogo > Categorias.",
          "Crie categorias como 'Lanches', 'Bebidas', 'Sobremesas', etc.",
          "Reordene as categorias arrastando ou alterando a ordem.",
          "Ative ou desative categorias para controlar o que aparece no cardápio.",
        ],
      },
      {
        title: "Produtos",
        description: "Cadastre e gerencie os produtos do seu cardápio.",
        steps: [
          "Acesse Catálogo > Produtos.",
          "Clique em 'Novo Produto' e preencha nome, descrição e preço.",
          "Selecione a categoria e adicione uma imagem (opcional).",
          "Se o produto tiver tamanhos/sabores, ative 'Variantes' e cadastre cada opção com preço próprio.",
          "Vincule grupos de adicionais ao produto.",
          "Cadastre ingredientes removíveis (ex: 'sem cebola').",
        ],
      },
      {
        title: "Adicionais",
        description: "Crie grupos de adicionais para complementar os produtos.",
        steps: [
          "Acesse Catálogo > Adicionais.",
          "Crie um grupo (ex: 'Molhos', 'Extras') definindo mínimo e máximo de seleções.",
          "Adicione os itens ao grupo com nome e preço.",
          "Vincule o grupo aos produtos desejados na tela de Produtos.",
        ],
      },
    ],
  },
  {
    label: "Configurações",
    icon: Settings,
    topics: [
      {
        title: "Mesas",
        description: "Gerencie as mesas do seu estabelecimento.",
        steps: [
          "Acesse Configurações > Mesas.",
          "Adicione mesas com número e nome identificador.",
          "Gere o QR Code de cada mesa para o cliente acessar o cardápio digital.",
          "Ative ou desative mesas conforme necessário.",
        ],
      },
      {
        title: "Entregadores",
        description: "Cadastre os entregadores da sua empresa.",
        steps: [
          "Acesse Configurações > Entregadores.",
          "Adicione entregadores com nome e telefone.",
          "Ative ou desative conforme disponibilidade.",
          "Entregadores cadastrados aparecem para seleção na gestão de entregas.",
        ],
      },
      {
        title: "Usuários",
        description: "Crie contas de acesso e atribua perfis aos colaboradores da empresa.",
        steps: [
          "Acesse Configurações > Usuários.",
          "Clique em 'Novo Usuário' e informe nome, email e senha.",
          "Selecione os perfis (roles) do usuário: Garçom, Atendente, Cozinha, Entregador, etc.",
          "O usuário poderá fazer login com o email e senha criados.",
          "Para alterar os perfis, clique em 'Editar' ao lado do usuário.",
          "Para remover o acesso, clique no ícone de lixeira.",
        ],
      },
      {
        title: "Perfis e Permissões",
        description: "Configure quais telas cada perfil pode acessar no sistema.",
        steps: [
          "Acesse Configurações > Usuários e veja a seção 'Perfis e Permissões'.",
          "Cada perfil (Garçom, Atendente, Cozinha, etc.) possui um conjunto de telas permitidas.",
          "Clique em 'Editar' ao lado de um perfil para alterar suas permissões.",
          "Marque ou desmarque as telas que o perfil deve ter acesso.",
          "Clique em 'Salvar' para aplicar as alterações.",
          "Administradores sempre têm acesso total — não precisam de configuração.",
          "As permissões são aplicadas imediatamente: o menu e as rotas são filtrados automaticamente.",
        ],
      },
      {
        title: "Tipos de Pedido",
        description: "Configure os tipos de pedido aceitos pela empresa.",
        steps: [
          "Acesse Configurações > Tipos de Pedido.",
          "Cada tipo define se exige mesa, endereço ou referência.",
          "Configure a origem (público ou interno) e a label exibida.",
          "Ative apenas os tipos que sua operação utiliza.",
        ],
      },
      {
        title: "Fluxo de Status",
        description: "Personalize os status pelos quais um pedido passa.",
        steps: [
          "Acesse Configurações > Fluxo de Status.",
          "Veja os status disponíveis (pendente, preparando, pronto, etc.).",
          "Personalize cores e labels de cada status.",
          "Defina quais status se aplicam a quais tipos de pedido.",
          "Reordene os status para definir o fluxo correto.",
        ],
      },
      {
        title: "Configurações Gerais",
        description: "Ajuste dados da empresa e preferências do sistema.",
        steps: [
          "Acesse Configurações > Configurações.",
          "Edite nome, telefone, site, Instagram e endereço da empresa.",
          "Configure o banner e logo exibidos no cardápio público.",
          "Ajuste preferências como taxa de entrega padrão e outras opções.",
        ],
      },
    ],
  },
  {
    label: "Integração iFood",
    icon: ExternalLink,
    topics: [
      {
        title: "1. Criar conta no iFood Developer",
        description: "Primeiro passo: registrar sua empresa na plataforma de desenvolvedores do iFood.",
        steps: [
          "Acesse developer.ifood.com.br e crie uma conta Professional (com CNPJ).",
          "No painel do iFood Developer, crie uma nova Aplicação do tipo 'Centralizado'.",
          "Anote o Client ID e o Client Secret gerados — você precisará deles no próximo passo.",
          "O iFood fornecerá um Merchant ID (UUID) para a sua loja. Anote também.",
          "Se for testar primeiro, use as credenciais do ambiente de Sandbox (teste).",
        ],
      },
      {
        title: "2. Configurar credenciais no sistema",
        description: "Inserir as credenciais do iFood no painel administrativo do FluoDelivery.",
        steps: [
          "No FluoDelivery, acesse Configurações > iFood.",
          "Preencha o campo Merchant ID com o UUID da sua loja no iFood.",
          "Preencha o Client ID e o Client Secret fornecidos pelo iFood Developer.",
          "Se desejar receber pedidos em tempo real (recomendado para produção), ative o Modo Webhook.",
          "No modo Webhook, copie a URL exibida e configure-a no Portal de Parceiros do iFood.",
          "Clique em 'Salvar Credenciais'.",
        ],
      },
      {
        title: "3. Ativar a integração",
        description: "Ligar a conexão com o iFood para começar a operar.",
        steps: [
          "Na mesma tela de iFood, clique no botão 'Ativar iFood'.",
          "O sistema criará automaticamente um tipo de pedido 'iFood' no seu fluxo.",
          "Os status de pedido existentes serão vinculados às ações do iFood (confirmar, preparar, etc.).",
          "O sistema começará a consultar o iFood a cada 30 segundos buscando novos pedidos.",
          "Um indicador 'Ativo' aparecerá confirmando que a integração está funcionando.",
        ],
      },
      {
        title: "4. Configurar horários de funcionamento",
        description: "Definir os horários em que sua loja estará aberta para receber pedidos.",
        steps: [
          "Na tela de iFood, role até a seção 'Horários de Funcionamento'.",
          "Para cada dia da semana, defina o horário de abertura e fechamento.",
          "Desative os dias em que a loja não funciona (ex: domingo).",
          "Clique em 'Salvar Horários'.",
          "Os horários serão sincronizados com o iFood automaticamente.",
        ],
      },
      {
        title: "5. Mapear produtos para o iFood",
        description: "Vincular seus produtos locais ao catálogo do iFood para que os pedidos sejam reconhecidos.",
        steps: [
          "Acesse Catálogo > Produtos e edite cada produto que deseja vender no iFood.",
          "No futuro, o campo 'Código iFood' permitirá vincular o produto ao catálogo do iFood.",
          "Os adicionais, variantes e ingredientes também podem ser vinculados.",
          "Mesmo sem vinculação, pedidos do iFood são recebidos com os nomes e preços do iFood.",
          "Para sincronizar o cardápio completo, use o botão 'Sincronizar Agora' na tela de iFood.",
          "A sincronização respeita o limite do iFood de um envio a cada 30 minutos.",
        ],
      },
      {
        title: "6. Mapear status de pedido",
        description: "Definir qual ação executar no iFood quando você alterar o status de um pedido.",
        steps: [
          "Na tela de iFood, veja a seção 'Mapeamento de Status'.",
          "Cada status local (Confirmado, Em Preparo, Pronto, etc.) pode ter uma ação no iFood.",
          "As ações disponíveis são: Confirmar pedido, Iniciar preparo, Pronto para retirada e Despachar.",
          "Os mapeamentos padrão já são criados ao ativar, mas você pode personalizar.",
          "Exemplo: quando você muda um pedido iFood para 'Pronto', o iFood é notificado automaticamente.",
          "Clique em 'Salvar Mapeamentos' após ajustar.",
        ],
      },
      {
        title: "7. Receber e tratar pedidos do iFood",
        description: "Como os pedidos do iFood chegam e como gerenciá-los no dia a dia.",
        steps: [
          "Quando um cliente faz um pedido no iFood, ele aparece automaticamente na tela de Pedidos.",
          "Pedidos do iFood são identificados com o tipo 'iFood' e um código de exibição do iFood.",
          "O pedido é confirmado automaticamente no iFood assim que é recebido pelo sistema.",
          "Gerencie o pedido normalmente: altere o status conforme o preparo avança.",
          "Cada mudança de status é sincronizada com o iFood (conforme o mapeamento configurado).",
          "O cliente do iFood é cadastrado automaticamente pelo telefone, entrando no programa de fidelidade.",
          "Pedidos cancelados no iFood são atualizados automaticamente para 'Cancelado' no sistema.",
        ],
      },
      {
        title: "8. Acompanhar sincronização",
        description: "Monitorar se a integração está funcionando corretamente.",
        steps: [
          "Na tela de iFood, a seção 'Sincronização de Cardápio' mostra o último envio.",
          "Um badge verde indica sucesso; vermelho indica erro (com detalhes).",
          "O badge 'Pendente' aparece quando há mudanças no cardápio ainda não enviadas ao iFood.",
          "Use o botão 'Sincronizar Agora' para forçar o envio imediato.",
          "No iFood, você pode verificar o status da loja (aberto/fechado) direto pelo sistema.",
          "Se a integração parar de funcionar, verifique as credenciais e se o iFood está ativo.",
        ],
      },
      {
        title: "Resolução de problemas",
        description: "Soluções para problemas comuns na integração com o iFood.",
        steps: [
          "Pedidos não chegam: verifique se a integração está 'Ativa' e se as credenciais estão corretas.",
          "Erro de autenticação: confira o Client ID e Secret. Gere novas credenciais no iFood Developer se necessário.",
          "Status não sincroniza: verifique os mapeamentos na seção 'Mapeamento de Status'.",
          "Cardápio não atualiza: respeite o intervalo de 30 minutos entre sincronizações.",
          "Para modo Webhook: certifique-se de que o servidor está acessível pela internet (IP público ou domínio).",
          "Em caso de dúvida, desative e reative a integração para resetar as configurações.",
        ],
      },
    ],
  },
];

export default function Ajuda() {
  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Central de Ajuda</h1>
            <p className="text-sm text-muted-foreground">Aprenda a utilizar cada funcionalidade do sistema.</p>
          </div>
        </div>

        <div className="space-y-4">
          {helpSections.map((section) => (
            <div key={section.label} className="rounded-lg border bg-card">
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
                <section.icon className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wide">{section.label}</h2>
              </div>
              <Accordion type="multiple">
                {section.topics.map((topic) => (
                  <AccordionItem key={topic.title} value={topic.title} className="px-4">
                    <AccordionTrigger className="text-left">
                      <div>
                        <span className="font-medium">{topic.title}</span>
                        <p className="text-xs text-muted-foreground font-normal">{topic.description}</p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
                        {topic.steps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
