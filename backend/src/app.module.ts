import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { EmpresaAccessGuard } from './common/guards/empresa-access.guard';
import { ApiKeyGuard } from './common/guards/api-key.guard';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { FormasPagamentoModule } from './formas-pagamento/formas-pagamento.module';
import { ConfiguracoesModule } from './configuracoes/configuracoes.module';
import { MesasModule } from './mesas/mesas.module';
import { ClientesModule } from './clientes/clientes.module';
import { EntregadoresModule } from './entregadores/entregadores.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { PedidoTiposConfigModule } from './pedido-tipos-config/pedido-tipos-config.module';
import { PedidoStatusConfigModule } from './pedido-status-config/pedido-status-config.module';
import { FidelidadeModule } from './fidelidade/fidelidade.module';
import { CuponsModule } from './cupons/cupons.module';
import { PerfilPermissoesModule } from './perfil-permissoes/perfil-permissoes.module';
import { EmpresasModule } from './empresas/empresas.module';
import { CategoriasModule } from './categorias/categorias.module';
import { ProdutosModule } from './produtos/produtos.module';
import { AdicionaisModule } from './adicionais/adicionais.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { ContasModule } from './contas/contas.module';
import { CaixaModule } from './caixa/caixa.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    EmpresasModule,
    CategoriasModule,
    ProdutosModule,
    AdicionaisModule,
    FormasPagamentoModule,
    ConfiguracoesModule,
    MesasModule,
    ClientesModule,
    EntregadoresModule,
    UsuariosModule,
    PedidoTiposConfigModule,
    PedidoStatusConfigModule,
    FidelidadeModule,
    CuponsModule,
    PerfilPermissoesModule,
    PedidosModule,
    ContasModule,
    CaixaModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: EmpresaAccessGuard },
    { provide: APP_GUARD, useClass: ApiKeyGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
