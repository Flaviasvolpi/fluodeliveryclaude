import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.sub) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    const empresaId =
      request.params?.empresaId || request.body?.empresaId;

    if (!empresaId) {
      throw new ForbiddenException('empresa_id não informado');
    }

    const roles = await this.prisma.userRole.findMany({
      where: {
        userId: user.sub,
        empresaId,
        role: { in: requiredRoles },
      },
    });

    if (roles.length === 0) {
      throw new ForbiddenException('Sem permissão para esta operação');
    }

    return true;
  }
}
