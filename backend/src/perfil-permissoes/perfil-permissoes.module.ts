import { Module } from '@nestjs/common';
import { PerfilPermissoesController } from './perfil-permissoes.controller';
import { PerfilPermissoesService } from './perfil-permissoes.service';

@Module({
  controllers: [PerfilPermissoesController],
  providers: [PerfilPermissoesService],
  exports: [PerfilPermissoesService],
})
export class PerfilPermissoesModule {}
