import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateEntregadorDto {
  @IsString() nome: string;
  @IsOptional() @IsString() telefone?: string;
  @IsOptional() @IsBoolean() ativo?: boolean;
}

export class UpdateEntregadorDto {
  @IsOptional() @IsString() nome?: string;
  @IsOptional() @IsString() telefone?: string;
  @IsOptional() @IsBoolean() ativo?: boolean;
}
