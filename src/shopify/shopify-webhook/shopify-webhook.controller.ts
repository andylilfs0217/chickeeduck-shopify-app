import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpException,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ShopifyWebhookService } from './shopify-webhook.service';

@Controller('shopify-webhook')
export class ShopifyWebhookController {
  constructor(private readonly shopifyWebhookService: ShopifyWebhookService) {}
  /**
   * Webhook for users created an order on Shopify
   * @param req Request information
   * @param body Webhook body
   * @returns Webhook successfully received
   */
  @Post('orders/create')
  async onReceiveOrderCreate(@Headers() headers: Headers, @Body() body: any) {
    try {
      // Get Hmac header
      const hmacHeader = headers['x-shopify-hmac-sha256'];
      if (!hmacHeader) throw new UnauthorizedException();
      // Validation
      const isWebhookValid =
        await this.shopifyWebhookService.verifyShopifyWebhook(body, hmacHeader);
      if (!isWebhookValid) throw new UnauthorizedException();

      // Testing
      const isTest = headers['x-shopify-test'] === 'true';

      // Check Shopify version
      const webhookVersion = headers['x-shopify-api-version'];
      switch (webhookVersion) {
        case process.env.API_VERSION:
        case '2021-07':
          this.shopifyWebhookService.updateChickeeDuckInventory(body);
          break;
        default:
          throw new BadRequestException('Unsupported Shopify API version');
      }
      return true;
    } catch (error) {
      switch (error) {
        case UnauthorizedException:
        case BadRequestException:
          throw error;
        default:
          throw new Error(error.message);
      }
    }
  }
}
