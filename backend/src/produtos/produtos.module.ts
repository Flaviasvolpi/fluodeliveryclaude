import { Module } from '@nestjs/common';
import { ProdutosController } from './produtos.controller';
import { ProdutoVariantesController } from './produto-variantes.controller';
import { ProdutoIngredientesController } from './produto-ingredientes.controller';
import { ProdutoAdicionaisGruposController } from './produto-adicionais-grupos.controller';
import { ProdutosService } from './produtos.service';

@Module({
  controllers: [
    ProdutosController,
    ProdutoVariantesController,
    ProdutoIngredientesController,
    ProdutoAdicionaisGruposController,
  ],
  providers: [ProdutosService],
  exports: [ProdutosService],
})
export class ProdutosModule {}
