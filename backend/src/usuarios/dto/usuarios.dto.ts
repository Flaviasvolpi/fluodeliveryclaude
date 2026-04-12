import { IsString, IsEnum } from 'class-validator';

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
