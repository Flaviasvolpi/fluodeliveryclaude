import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class CreatePedidoTipoConfigDto {
  @IsString() tipoKey: string;
  @IsString() label: string;
  @IsOptional() @IsBoolean() ativo?: boolean;
  @IsOptional() @IsInt() ordem?: number;
  @IsOptional() @IsString() origem?: string;
  @IsOptional() @IsBoolean() exigeEndereco?: boolean;
  @IsOptional() @IsBoolean() exigeMesa?: boolean;
  @IsOptional() @IsBoolean() exigeReferencia?: boolean;
  @IsOptional() @IsBoolean() referenciaAuto?: boolean;
  @IsOptional() @IsString() referenciaLabel?: string;
  @IsOptional() @IsBoolean() cobraTaxaServico?: boolean;
}

export class UpdatePedidoTipoConfigDto {
  @IsOptional() @IsString() tipoKey?: string;
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsBoolean() ativo?: boolean;
  @IsOptional() @IsInt() ordem?: number;
  @IsOptional() @IsString() origem?: string;
  @IsOptional() @IsBoolean() exigeEndereco?: boolean;
  @IsOptional() @IsBoolean() exigeMesa?: boolean;
  @IsOptional() @IsBoolean() exigeReferencia?: boolean;
  @IsOptional() @IsBoolean() referenciaAuto?: boolean;
  @IsOptional() @IsString() referenciaLabel?: string;
  @IsOptional() @IsBoolean() cobraTaxaServico?: boolean;
}
