import { IsString, IsEnum, IsOptional, IsArray } from 'class-validator';

enum AppRole {
  admin = 'admin',
  atendente = 'atendente',
  cozinha = 'cozinha',
  entregador = 'entregador',
  garcom = 'garcom',
}

export class AssignRoleDto {
  @IsString() userId: string;
  @IsEnum(AppRole) role: AppRole;
}

export class CreateUsuarioDto {
  @IsString() email: string;
  @IsString() password: string;
  @IsOptional() @IsString() nome?: string;
  @IsOptional() @IsArray() roles?: string[];
}

export class UpdateRolesDto {
  @IsString() userId: string;
  @IsArray() roles: string[];
}
