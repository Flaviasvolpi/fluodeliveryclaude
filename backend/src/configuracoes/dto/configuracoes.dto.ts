import { IsString, IsOptional } from 'class-validator';

export class UpsertConfiguracaoDto {
  @IsString() chave: string;
  @IsOptional() @IsString() valor?: string;
}
