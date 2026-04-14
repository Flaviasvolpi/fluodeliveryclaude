import { Controller, Post, Req, Body, HttpCode } from '@nestjs/common';
import { Public } from '../common/decorators';
import { PrismaService } from '../prisma/prisma.service';
import { IfoodEventsService } from './ifood-events.service';
import * as crypto from 'crypto';

@Controller('webhooks/ifood')
export class IfoodWebhookController {
  constructor(
    private prisma: PrismaService,
    private eventsService: IfoodEventsService,
  ) {}

  @Public()
  @Post()
  @HttpCode(202)
  async handleWebhook(@Req() req: any, @Body() body: any): Promise<void> {
    const signature = req.headers['x-ifood-signature'];
    const merchantId = body.merchantId;

    if (!merchantId) return;

    // Find empresa by merchantId
    const empresa = await this.prisma.empresa.findFirst({
      where: { ifoodMerchantId: merchantId, ifoodAtivo: true, ifoodWebhookMode: true },
      select: { id: true, ifoodClientSecret: true },
    });

    if (!empresa) return;

    // Verify HMAC-SHA256 signature
    if (signature && empresa.ifoodClientSecret) {
      const rawBody = JSON.stringify(body);
      const expected = crypto
        .createHmac('sha256', empresa.ifoodClientSecret)
        .update(rawBody, 'utf-8')
        .digest('hex');

      if (signature !== expected) {
        console.warn('[iFood Webhook] Invalid signature for merchant', merchantId);
        return;
      }
    }

    // Process asynchronously (must respond 202 within 5s)
    setImmediate(() => {
      this.eventsService.processSingleEvent(empresa.id, body).catch((err) => {
        console.error('[iFood Webhook] Processing error:', err.message);
      });
    });
  }
}
