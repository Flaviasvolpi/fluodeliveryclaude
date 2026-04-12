import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, IS_API_KEY_AUTH } from '../decorators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EmpresaAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const isApiKey = this.reflector.getAllAndOverride<boolean>(IS_API_KEY_AUTH, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isApiKey) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const empresaId = request.params?.empresaId;

    if (!empresaId) return true;

    if (!user?.sub) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    const hasAccess = await this.prisma.userRole.findFirst({
      where: {
        userId: user.sub,
        empresaId,
      },
    });

    if (!hasAccess) {
      throw new ForbiddenException('Sem acesso a esta empresa');
    }

    return true;
  }
}
