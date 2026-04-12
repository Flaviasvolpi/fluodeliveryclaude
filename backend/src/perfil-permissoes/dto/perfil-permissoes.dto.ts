import { IsString, IsEnum } from 'class-validator';

enum AppRole {
  admin = 'admin',
  atendente = 'atendente',
  cozinha = 'cozinha',
  entregador = 'entregador',
  garcom = 'garcom',
}

export class CreatePerfilPermissaoDto {
  @IsEnum(AppRole) role: AppRole;
  @IsString() telaKey: string;
}
