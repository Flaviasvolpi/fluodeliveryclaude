import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateFormaPagamentoDto {
  @IsString() nome: string;
  @IsOptional() @IsBoolean() ativo?: boolean;
  @IsOptional() @IsBoolean() exigeTroco?: boolean;
}

export class UpdateFormaPagamentoDto {
  @IsOptional() @IsString() nome?: string;
  @IsOptional() @IsBoolean() ativo?: boolean;
  @IsOptional() @IsBoolean() exigeTroco?: boolean;
}
