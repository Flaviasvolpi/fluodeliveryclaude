import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2] || 'admin@fluodelivery.com';
  const password = process.argv[3] || 'admin123';
  const empresaNome = process.argv[4] || 'FluoDelivery Demo';
  const empresaSlug = process.argv[5] || 'demo';

  console.log('🔧 Criando empresa e usuário admin...\n');

  // 1. Create user
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, password: hashedPassword, fullName: 'Administrador' },
  });
  console.log(`✅ Usuário: ${user.email} (id: ${user.id})`);

  // 2. Create empresa
  const empresa = await prisma.empresa.upsert({
    where: { slug: empresaSlug },
    update: {},
    create: { nome: empresaNome, slug: empresaSlug },
  });
  console.log(`✅ Empresa: ${empresa.nome} (slug: ${empresa.slug})`);

  // 3. Create empresa_contadores
  await prisma.empresaContador.upsert({
    where: { empresaId: empresa.id },
    update: {},
    create: { empresaId: empresa.id, ultimoNumero: 0 },
  });

  // 4. Assign admin role
  await prisma.userRole.upsert({
    where: {
      userId_role_empresaId: {
        userId: user.id,
        role: 'admin',
        empresaId: empresa.id,
      },
    },
    update: {},
    create: { userId: user.id, role: 'admin', empresaId: empresa.id },
  });
  console.log(`✅ Role: admin atribuído para ${email} na empresa ${empresaNome}`);

  // 5. Seed default perfil_permissoes
  const defaultPermissoes = [
    { role: 'atendente' as const, telas: ['dashboard', 'pedidos', 'atendimento', 'fechamento', 'caixa', 'clientes', 'vendas', 'gestao-entregas', 'acerto-entregador'] },
    { role: 'garcom' as const, telas: ['atendimento', 'fechamento', 'cozinha', 'pedidos'] },
    { role: 'cozinha' as const, telas: ['cozinha'] },
  ];

  for (const { role, telas } of defaultPermissoes) {
    for (const telaKey of telas) {
      await prisma.perfilPermissao.upsert({
        where: {
          empresaId_role_telaKey: { empresaId: empresa.id, role, telaKey },
        },
        update: {},
        create: { empresaId: empresa.id, role, telaKey },
      });
    }
  }
  console.log(`✅ Permissões padrão criadas`);

  // 6. Seed default formas de pagamento
  const formas = ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX'];
  for (const nome of formas) {
    await prisma.formaPagamento.create({
      data: { empresaId: empresa.id, nome, exigeTroco: nome === 'Dinheiro' },
    }).catch(() => {}); // ignore if already exists
  }
  console.log(`✅ Formas de pagamento padrão criadas`);

  // 7. Seed default pedido tipos config
  const tipos = [
    { tipoKey: 'retirada', label: 'Retirada', ordem: 0 },
    { tipoKey: 'entrega', label: 'Entrega', ordem: 1 },
    { tipoKey: 'mesa', label: 'Mesa', ordem: 2 },
  ];
  for (const tipo of tipos) {
    await prisma.pedidoTipoConfig.upsert({
      where: { empresaId_tipoKey: { empresaId: empresa.id, tipoKey: tipo.tipoKey } },
      update: {},
      create: { empresaId: empresa.id, ...tipo },
    });
  }
  console.log(`✅ Tipos de pedido padrão criados`);

  // 8. Seed default pedido status config
  const statuses = [
    { statusKey: 'novo', label: 'Novo', cor: 'blue', ordem: 0 },
    { statusKey: 'confirmado', label: 'Confirmado', cor: 'yellow', ordem: 1 },
    { statusKey: 'preparo', label: 'Em Preparo', cor: 'orange', ordem: 2 },
    { statusKey: 'pronto', label: 'Pronto', cor: 'green', ordem: 3 },
    { statusKey: 'saiu_entrega', label: 'Saiu p/ Entrega', cor: 'purple', ordem: 4 },
    { statusKey: 'entregue', label: 'Entregue', cor: 'gray', ordem: 5 },
  ];
  for (const s of statuses) {
    await prisma.pedidoStatusConfig.upsert({
      where: { empresaId_statusKey: { empresaId: empresa.id, statusKey: s.statusKey } },
      update: {},
      create: { empresaId: empresa.id, ...s },
    });
  }
  console.log(`✅ Status de pedido padrão criados`);

  console.log('\n🎉 Seed completo!\n');
  console.log('Para fazer login:');
  console.log(`  Email: ${email}`);
  console.log(`  Senha: ${password}`);
  console.log(`  Empresa: ${empresaSlug}`);
  console.log(`\n  POST /api/auth/login { "email": "${email}", "password": "${password}" }`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
