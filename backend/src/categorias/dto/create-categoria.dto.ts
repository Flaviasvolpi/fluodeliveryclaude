import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class CreateCategoriaDto {
  @IsString() nome: string;
  @IsOptional() @IsInt() ordem?: number;
  @IsOptional() @IsBoolean() ativo?: boolean;
}

export class UpdateCategoriaDto {
  @IsOptional() @IsString() nome?: string;
  @IsOptional() @IsInt() ordem?: number;
  @IsOptional() @IsBoolean() ativo?: boolean;
}
