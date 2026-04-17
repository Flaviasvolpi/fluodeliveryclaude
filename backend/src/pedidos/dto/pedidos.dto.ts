import {
  IsString, IsOptional, IsNumber, IsBoolean, IsArray,
  ValidateNested, IsUUID, IsInt, IsObject, IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

class PedidoItemAdicionalDto {
  @IsOptional() @IsUUID() adicionalItemId?: string;
  @IsString() nomeSnapshot: string;
  @IsNumber() precoSnapshot: number;
  @IsOptional() @IsInt() qtd?: number;
}

class PedidoItemDto {
  @IsOptional() @IsUUID() produtoId?: string;
  @IsOptional() @IsUUID() produtoVarianteId?: string;
  @IsString() nomeSnapshot: string;
  @IsOptional() @IsString() varianteNomeSnapshot?: string;
  @IsNumber() precoUnitSnapshot: number;
  @IsOptional() @IsNumber() custoUnitSnapshot?: number;
  @IsInt() qtd: number;
  @IsOptional() @IsString() observacaoItem?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PedidoItemAdicionalDto)
  adicionais?: PedidoItemAdicionalDto[];
}

export class CreatePedidoDto {
  @IsString() clienteNome: string;
  @IsOptional() @IsString() clienteTelefone?: string;
  @IsString() tipo: string;
  @IsOptional() @IsObject() endereco?: Record<string, any>;
  @IsNumber() subtotal: number;
  @IsOptional() @IsNumber() taxaEntrega?: number;
  @IsOptional() @IsNumber() taxaServico?: number;
  @IsOptional() @IsUUID() formaPagamentoId?: string;
  @IsOptional() @IsString() observacoes?: string;
  @IsOptional() @IsUUID() mesaId?: string;
  @IsOptional() @IsUUID() garcomUserId?: string;
  @IsOptional() @IsString() referencia?: string;
  @IsOptional() @IsBoolean() pagarNaEntrega?: boolean;
  @IsOptional() @IsString() cupomCodigo?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PedidoItemDto)
  itens: PedidoItemDto[];
}

export class UpdatePedidoStatusDto {
  @IsString() pedidoStatus: string;
}

export class UpdatePedidoDto {
  @IsOptional() @IsString() pedidoStatus?: string;
  @IsOptional() @IsString() pagamentoStatus?: string;
  @IsOptional() @IsUUID() entregadorId?: string;
  @IsOptional() @IsString() observacoes?: string;
}

export class QueryPedidosDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() tipo?: string;
  @IsOptional() @IsString() dateFrom?: string;
  @IsOptional() @IsString() dateTo?: string;
  @IsOptional() @IsString() clienteTelefone?: string;
}
