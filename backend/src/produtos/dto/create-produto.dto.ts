import { IsString, IsOptional, IsInt, IsBoolean, IsNumber, IsArray, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVarianteDto {
  @IsString() nome: string;
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsNumber() custo?: number;
  @IsNumber() precoVenda: number;
  @IsOptional() @IsBoolean() ativo?: boolean;
  @IsOptional() @IsInt() ordem?: number;
}

export class CreateIngredienteDto {
  @IsString() nome: string;
  @IsOptional() @IsBoolean() removivel?: boolean;
  @IsOptional() @IsInt() ordem?: number;
  @IsOptional() @IsBoolean() ativo?: boolean;
}

export class CreateProdutoDto {
  @IsString() nome: string;
  @IsOptional() @IsString() descricao?: string;
  @IsOptional() @IsUUID() categoriaId?: string;
  @IsOptional() @IsBoolean() ativo?: boolean;
  @IsOptional() @IsString() imagemUrl?: string;
  @IsOptional() @IsInt() ordem?: number;
  @IsOptional() @IsBoolean() possuiVariantes?: boolean;
  @IsOptional() @IsNumber() custoBase?: number;
  @IsOptional() @IsNumber() precoBase?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVarianteDto)
  variantes?: CreateVarianteDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIngredienteDto)
  ingredientes?: CreateIngredienteDto[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  grupoIds?: string[];
}

export class UpdateProdutoDto {
  @IsOptional() @IsString() nome?: string;
  @IsOptional() @IsString() descricao?: string;
  @IsOptional() @IsUUID() categoriaId?: string;
  @IsOptional() @IsBoolean() ativo?: boolean;
  @IsOptional() @IsString() imagemUrl?: string;
  @IsOptional() @IsInt() ordem?: number;
  @IsOptional() @IsBoolean() possuiVariantes?: boolean;
  @IsOptional() @IsNumber() custoBase?: number;
  @IsOptional() @IsNumber() precoBase?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVarianteDto)
  variantes?: CreateVarianteDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIngredienteDto)
  ingredientes?: CreateIngredienteDto[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  grupoIds?: string[];
}
