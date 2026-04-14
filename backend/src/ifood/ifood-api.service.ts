import { Injectable } from '@nestjs/common';
import { IfoodAuthService } from './ifood-auth.service';

const BASE_URL = process.env.IFOOD_API_BASE_URL || 'https://merchant-api.ifood.com.br';

@Injectable()
export class IfoodApiService {
  constructor(private authService: IfoodAuthService) {}

  private async request(empresaId: string, method: string, path: string, body?: any): Promise<any> {
    const token = await this.authService.getValidToken(empresaId);
    const url = `${BASE_URL}${path}`;

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`iFood API ${method} ${path} failed (${res.status}): ${err}`);
    }

    const contentType = res.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return res.json();
    }
    return null;
  }

  // ---- Events (Polling) ----
  async pollEvents(empresaId: string): Promise<any[]> {
    return (await this.request(empresaId, 'GET', '/order/v1.0/events:polling')) ?? [];
  }

  async ackEvents(empresaId: string, eventIds: string[]): Promise<void> {
    if (!eventIds.length) return;
    await this.request(empresaId, 'POST', '/order/v1.0/events/acknowledgment', eventIds.map((id) => ({ id })));
  }

  // ---- Orders ----
  async getOrderDetails(empresaId: string, orderId: string): Promise<any> {
    return this.request(empresaId, 'GET', `/order/v1.0/orders/${orderId}`);
  }

  async confirmOrder(empresaId: string, orderId: string): Promise<void> {
    await this.request(empresaId, 'POST', `/order/v1.0/orders/${orderId}/confirm`);
  }

  async startPreparation(empresaId: string, orderId: string): Promise<void> {
    await this.request(empresaId, 'POST', `/order/v1.0/orders/${orderId}/startPreparation`);
  }

  async readyToPickup(empresaId: string, orderId: string): Promise<void> {
    await this.request(empresaId, 'POST', `/order/v1.0/orders/${orderId}/readyToPickup`);
  }

  async dispatchOrder(empresaId: string, orderId: string): Promise<void> {
    await this.request(empresaId, 'POST', `/order/v1.0/orders/${orderId}/dispatch`);
  }

  // ---- Merchant ----
  async getMerchantStatus(empresaId: string, merchantId: string): Promise<any> {
    return this.request(empresaId, 'GET', `/merchant/v1.0/merchants/${merchantId}/status`);
  }

  async updateMerchantStatus(empresaId: string, merchantId: string, available: boolean): Promise<void> {
    await this.request(empresaId, 'PATCH', `/merchant/v1.0/merchants/${merchantId}/status`, [
      { operation: 'replace', path: '/available', value: available },
    ]);
  }

  async getMerchantOpeningHours(empresaId: string, merchantId: string): Promise<any> {
    return this.request(empresaId, 'GET', `/merchant/v1.0/merchants/${merchantId}/opening-hours`);
  }

  async updateMerchantOpeningHours(empresaId: string, merchantId: string, hours: any): Promise<void> {
    await this.request(empresaId, 'PUT', `/merchant/v1.0/merchants/${merchantId}/opening-hours`, hours);
  }

  // ---- Catalog ----
  async pushCatalog(empresaId: string, merchantId: string, catalogPayload: any): Promise<any> {
    return this.request(empresaId, 'POST', `/catalog/v2.0/merchants/${merchantId}/products`, catalogPayload);
  }
}
