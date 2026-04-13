import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public, CurrentUser } from '../common/decorators';
import type { JwtPayload } from '../common/decorators';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get('me')
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub);
  }

  @Get('me/roles')
  getRoles(@CurrentUser() user: JwtPayload) {
    return this.authService.getUserRoles(user.sub);
  }

  @Get('me/empresas')
  getEmpresas(@CurrentUser() user: JwtPayload) {
    return this.authService.getUserEmpresas(user.sub);
  }
}
