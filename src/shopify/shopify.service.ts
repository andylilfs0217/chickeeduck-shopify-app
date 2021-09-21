import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { map } from 'rxjs';
import { PathUtils } from 'src/utils/path.utils';

@Injectable()
export class ShopifyService {
  constructor(private httpService: HttpService) {}

  /**
   * Create a webhook to ChickeeDuck Shopify
   * @returns Create webhook response
   */
  createWebhook() {
    try {
      const body = {
        webhook: {
          topic: 'orders/create',
          address: 'https://12345.ngrok.io/',
          format: 'json',
        },
      };
      return this.httpService
        .post(PathUtils.getChickeeDuckAdminAPI('webhooks'), body, {
          headers: { 'X-Shopify-Topic': 'orders/create' },
        })
        .pipe(map((res) => res.data));
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Get all orders on ChickeeDuck Shopify
   * @returns All Shopify orders
   */
  getAllOrders() {
    try {
      return this.httpService
        .get(PathUtils.getChickeeDuckAdminAPI('orders'))
        .pipe(map((res) => res.data));
    } catch (error) {
      throw new Error(error);
    }
  }
}
