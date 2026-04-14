import { IsString, IsOptional, IsBoolean, IsInt, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateIfoodConfigDto {
  @IsOptional() @IsString() ifoodMerchantId?: string;
  @IsOptional() @IsString() ifoodClientId?: string;
  @IsOptional() @IsString() ifoodClientSecret?: string;
  @IsOptional() @IsBoolean() ifoodWebhookMode?: boolean;
}

export class IfoodStatusMappingDto {
  @IsString() localStatusKey: string;
  @IsString() ifoodAction: string; // confirm | startPreparation | readyToPickup | dispatch | ''
}

export class BulkIfoodStatusMappingDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IfoodStatusMappingDto)
  mappings: IfoodStatusMappingDto[];
}

export class HorarioDto {
  @IsInt() diaSemana: number; // 0=Dom ... 6=Sab
  @IsString() horaAbrir: string; // "09:00"
  @IsString() horaFechar: string; // "23:00"
  @IsOptional() @IsBoolean() ativo?: boolean;
}

export class BulkHorariosDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HorarioDto)
  horarios: HorarioDto[];
}
