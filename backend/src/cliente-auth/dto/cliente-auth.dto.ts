import { IsString, IsOptional, IsUUID, IsBoolean, Length } from 'class-validator';

export class VerificarTelefoneDto {
  @IsUUID() empresaId: string;
  @IsString() telefone: string;
}

export class VerificarPinDto {
  @IsUUID() empresaId: string;
  @IsString() telefone: string;
  @IsString() @Length(4, 4) pin: string;
}

export class CadastrarClienteDto {
  @IsUUID() empresaId: string;
  @IsString() telefone: string;
  @IsString() nome: string;
  @IsString() @Length(4, 4) pin: string;
}

export class MeusPedidosDto {
  @IsUUID() clienteId: string;
  @IsUUID() empresaId: string;
}

export class MeusCuponsDto {
  @IsUUID() clienteId: string;
  @IsUUID() empresaId: string;
}

export class MeusEnderecosDto {
  @IsUUID() clienteId: string;
  @IsUUID() empresaId: string;
  @IsOptional() @IsString() action?: string;
  @IsOptional() endereco?: {
    id?: string;
    apelido?: string;
    rua: string;
    numero: string;
    bairro: string;
    complemento?: string;
    referencia?: string;
    padrao?: boolean;
  };
}
