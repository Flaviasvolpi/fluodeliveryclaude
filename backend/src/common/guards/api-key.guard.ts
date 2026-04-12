import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_API_KEY_AUTH } from '../decorators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isApiKey = this.reflector.getAllAndOverride<boolean>(IS_API_KEY_AUTH, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isApiKey) return true;

    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedException('API key não informada');
    }

    const empresa = await this.prisma.empresa.findUnique({
      where: { apiKey },
      select: { id: true, slug: true, ativo: true },
    });

    if (!empresa || !empresa.ativo) {
      throw new UnauthorizedException('API key inválida');
    }

    request.empresa = empresa;
    return true;
  }
}
