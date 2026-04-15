import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString() @MinLength(3) fullName: string;
  @IsEmail() email: string;
  @IsString() @MinLength(6) password: string;
  @IsString() @MinLength(2) empresaNome: string;
  @IsOptional() @IsString() empresaSlug?: string;
}
