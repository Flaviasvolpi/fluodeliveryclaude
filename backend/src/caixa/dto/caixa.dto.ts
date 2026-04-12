import { IsString, IsOptional, IsNumber, IsUUID, IsBoolean } from 'class-validator';

export class AbrirCaixaDto {
  @IsOptional() @IsNumber() valorAbertura?: number;
  @IsOptional() @IsString() observacoes?: string;
}

export class FecharCaixaDto {
  @IsOptional() @IsNumber() valorFechamento?: number;
  @IsOptional() @IsString() observacoes?: string;
}

export class CreateRecebimentoDto {
  @IsOptional() @IsUUID() caixaSessaoId?: string;
  @IsOptional() @IsUUID() pedidoId?: string;
  @IsOptional() @IsUUID() contaId?: string;
  @IsOptional() @IsUUID() formaPagamentoId?: string;
  @IsNumber() valor: number;
  @IsOptional() @IsString() tipoOrigem?: string;
  @IsOptional() @IsUUID() motoboyUserId?: string;
}

export class CreateAcertoDto {
  @IsOptional() @IsUUID() caixaSessaoId?: string;
  @IsUUID() motoboyUserId: string;
  @IsNumber() totalColetado: number;
  @IsNumber() totalDevolvido: number;
}

export class AbrirEntregadorCaixaDto {
  @IsUUID() entregadorId: string;
  @IsOptional() @IsUUID() caixaSessaoId?: string;
  @IsOptional() @IsNumber() suprimento?: number;
}

export class CreateEntregadorRecebimentoDto {
  @IsUUID() entregadorCaixaId: string;
  @IsOptional() @IsUUID() pedidoId?: string;
  @IsOptional() @IsUUID() formaPagamentoId?: string;
  @IsNumber() valor: number;
}
