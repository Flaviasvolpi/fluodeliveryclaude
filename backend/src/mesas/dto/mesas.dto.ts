import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class CreateMesaDto {
  @IsInt() numero: number;
  @IsString() nome: string;
  @IsOptional() @IsBoolean() ativo?: boolean;
}

export class UpdateMesaDto {
  @IsOptional() @IsInt() numero?: number;
  @IsOptional() @IsString() nome?: string;
  @IsOptional() @IsBoolean() ativo?: boolean;
}
