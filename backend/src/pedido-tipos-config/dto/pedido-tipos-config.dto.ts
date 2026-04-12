import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class CreatePedidoTipoConfigDto {
  @IsString() tipoKey: string;
  @IsString() label: string;
  @IsOptional() @IsBoolean() ativo?: boolean;
  @IsOptional() @IsInt() ordem?: number;
}

export class UpdatePedidoTipoConfigDto {
  @IsOptional() @IsString() tipoKey?: string;
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsBoolean() ativo?: boolean;
  @IsOptional() @IsInt() ordem?: number;
}
