import { IsString, IsOptional, IsInt, IsBoolean, IsNumber } from 'class-validator';

export class CreateFidelidadeRegraDto {
  @IsString() nome: string;
  @IsOptional() @IsString() tipoRecompensa?: string;
  @IsOptional() @IsNumber() valorRecompensa?: number;
  @IsOptional() @IsInt() metaPedidos?: number;
  @IsOptional() @IsNumber() metaValor?: number;
  @IsOptional() @IsInt() validadeDias?: number;
  @IsOptional() @IsBoolean() ativo?: boolean;
}

export class UpdateFidelidadeRegraDto {
  @IsOptional() @IsString() nome?: string;
  @IsOptional() @IsString() tipoRecompensa?: string;
  @IsOptional() @IsNumber() valorRecompensa?: number;
  @IsOptional() @IsInt() metaPedidos?: number;
  @IsOptional() @IsNumber() metaValor?: number;
  @IsOptional() @IsInt() validadeDias?: number;
  @IsOptional() @IsBoolean() ativo?: boolean;
}
