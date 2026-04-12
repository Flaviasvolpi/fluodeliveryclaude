import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class ExternalItemAdicionalDto {
  @IsString() nome: string;
  @IsNumber() preco: number;
  @IsOptional() @IsInt() qtd?: number;
}

class ExternalItemDto {
  @IsString() nome: string;
  @IsNumber() preco: number;
  @IsInt() qtd: number;
  @IsOptional() @IsString() variante?: string;
  @IsOptional() @IsString() observacao?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExternalItemAdicionalDto)
  adicionais?: ExternalItemAdicionalDto[];
}

export class CreateExternalOrderDto {
  @IsString() clienteNome: string;
  @IsOptional() @IsString() clienteTelefone?: string;
  @IsOptional() @IsString() tipo?: string;
  @IsOptional() @IsString() observacoes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExternalItemDto)
  itens: ExternalItemDto[];
}

export class ConsultarPedidosDto {
  @IsOptional() @IsString() telefone?: string;
  @IsOptional() @IsInt() numero?: number;
  @IsOptional() @IsString() status?: string;
}
