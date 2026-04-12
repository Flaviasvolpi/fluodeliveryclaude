import { IsString, IsOptional, IsInt, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEnderecoDto {
  @IsOptional() @IsString() apelido?: string;
  @IsString() rua: string;
  @IsString() numero: string;
  @IsString() bairro: string;
  @IsOptional() @IsString() complemento?: string;
  @IsOptional() @IsString() referencia?: string;
  @IsOptional() @IsBoolean() padrao?: boolean;
}

export class UpdateEnderecoDto {
  @IsOptional() @IsString() apelido?: string;
  @IsOptional() @IsString() rua?: string;
  @IsOptional() @IsString() numero?: string;
  @IsOptional() @IsString() bairro?: string;
  @IsOptional() @IsString() complemento?: string;
  @IsOptional() @IsString() referencia?: string;
  @IsOptional() @IsBoolean() padrao?: boolean;
}

export class CreateClienteDto {
  @IsString() telefone: string;
  @IsString() nome: string;
  @IsOptional() @IsString() pinHash?: string;
  @IsOptional() @IsInt() ultimoCupomPedidos?: number;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateEnderecoDto)
  enderecos?: CreateEnderecoDto[];
}

export class UpdateClienteDto {
  @IsOptional() @IsString() telefone?: string;
  @IsOptional() @IsString() nome?: string;
  @IsOptional() @IsString() pinHash?: string;
  @IsOptional() @IsInt() ultimoCupomPedidos?: number;
}
