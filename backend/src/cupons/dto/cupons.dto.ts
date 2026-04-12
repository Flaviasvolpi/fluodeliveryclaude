import { IsString, IsOptional, IsInt, IsBoolean, IsNumber, IsDateString } from 'class-validator';

export class CreateCupomDto {
  @IsString() codigo: string;
  @IsOptional() @IsString() tipoDesconto?: string;
  @IsOptional() @IsNumber() valorDesconto?: number;
  @IsOptional() @IsNumber() valorMinimo?: number;
  @IsOptional() @IsInt() usoMaximo?: number;
  @IsOptional() @IsInt() usoAtual?: number;
  @IsOptional() @IsDateString() validoAte?: string;
  @IsOptional() @IsBoolean() ativo?: boolean;
  @IsOptional() @IsString() regraId?: string;
  @IsOptional() @IsString() clienteId?: string;
}

export class UpdateCupomDto {
  @IsOptional() @IsString() codigo?: string;
  @IsOptional() @IsString() tipoDesconto?: string;
  @IsOptional() @IsNumber() valorDesconto?: number;
  @IsOptional() @IsNumber() valorMinimo?: number;
  @IsOptional() @IsInt() usoMaximo?: number;
  @IsOptional() @IsInt() usoAtual?: number;
  @IsOptional() @IsDateString() validoAte?: string;
  @IsOptional() @IsBoolean() ativo?: boolean;
  @IsOptional() @IsString() regraId?: string;
  @IsOptional() @IsString() clienteId?: string;
}
