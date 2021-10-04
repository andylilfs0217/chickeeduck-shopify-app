import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ShopifyInterceptor } from 'src/interceptors/shopify.interceptor';
import { ShopifyWebhookService } from './shopify-webhook.service';

@Controller('shopify-webhook')
@UseInterceptors(ShopifyInterceptor)
export class ShopifyWebhookController {
  constructor(private readonly shopifyWebhookService: ShopifyWebhookService) {}
  util = require('util');
  /**
   * Webhook for users created an order on Shopify
   * @param req Request information
   * @param body Webhook body
   * @returns Webhook successfully received
   */
  @Post('orders/create')
  async onReceiveOrderCreate(@Headers() headers: Headers, @Body() body: any) {
    try {
      // Check Shopify version
      const webhookVersion = headers['x-shopify-api-version'];
      switch (webhookVersion) {
        case process.env.API_VERSION:
        case '2021-10':
        case '2021-07':
          this.shopifyWebhookService.updateChickeeDuckInventory(body);
          break;
        default:
          throw new BadRequestException('Unsupported Shopify API version');
      }
      return true;
    } catch (error) {
      throw error;
    }
  }
}
