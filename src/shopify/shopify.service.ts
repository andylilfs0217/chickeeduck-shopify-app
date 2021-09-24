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
          address: `${process.env.SERVER_URL}/shopify-webhook/orders/create`,
          format: 'json',
        },
      };
      return this.httpService
        .post(PathUtils.getChickeeDuckShopifyAdminAPI('webhooks'), body)
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
        .get(PathUtils.getChickeeDuckShopifyAdminAPI('orders'))
        .pipe(map((res) => res.data));
    } catch (error) {
      throw new Error(error);
    }
  }
}
