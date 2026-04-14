import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const IFOOD_TOKEN_URL = 'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token';
const TOKEN_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before expiry

@Injectable()
export class IfoodAuthService {
  constructor(private prisma: PrismaService) {}

  async getValidToken(empresaId: string): Promise<string> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { ifoodClientId: true, ifoodClientSecret: true, ifoodAtivo: true },
    });

    if (!empresa?.ifoodAtivo || !empresa.ifoodClientId || !empresa.ifoodClientSecret) {
      throw new BadRequestException('iFood não está configurado para esta empresa');
    }

    // Check cached token
    const cached = await this.prisma.ifoodToken.findUnique({
      where: { empresaId },
    });

    if (cached && cached.expiresAt.getTime() > Date.now() + TOKEN_BUFFER_MS) {
      return cached.accessToken;
    }

    // Fetch new token from iFood
    const body = new URLSearchParams({
      grantType: 'client_credentials',
      clientId: empresa.ifoodClientId,
      clientSecret: empresa.ifoodClientSecret,
    });

    const res = await fetch(IFOOD_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new BadRequestException(`Erro ao obter token iFood: ${err}`);
    }

    const data = await res.json();
    const expiresAt = new Date(Date.now() + (data.expiresIn ?? 21600) * 1000);

    // Upsert token
    await this.prisma.ifoodToken.upsert({
      where: { empresaId },
      update: { accessToken: data.accessToken, expiresAt },
      create: { empresaId, accessToken: data.accessToken, expiresAt },
    });

    return data.accessToken;
  }
}
