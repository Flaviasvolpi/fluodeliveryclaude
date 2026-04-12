import { IsString, IsOptional, IsInt, IsBoolean, IsArray } from 'class-validator';

export class CreatePedidoStatusConfigDto {
  @IsString() statusKey: string;
  @IsString() label: string;
  @IsOptional() @IsString() cor?: string;
  @IsOptional() @IsBoolean() ativo?: boolean;
  @IsOptional() @IsInt() ordem?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) tiposAplicaveis?: string[];
}

export class UpdatePedidoStatusConfigDto {
  @IsOptional() @IsString() statusKey?: string;
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsString() cor?: string;
  @IsOptional() @IsBoolean() ativo?: boolean;
  @IsOptional() @IsInt() ordem?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) tiposAplicaveis?: string[];
}
