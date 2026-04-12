import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';

export class AddContaPagamentoDto {
  @IsUUID() contaId: string;
  @IsOptional() @IsUUID() formaPagamentoId?: string;
  @IsNumber() valor: number;
  @IsOptional() @IsString() pessoaLabel?: string;
}

export class FecharContaDto {
  @IsUUID() contaId: string;
}
