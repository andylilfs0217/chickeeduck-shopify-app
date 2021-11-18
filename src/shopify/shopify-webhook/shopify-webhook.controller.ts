import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Inject,
  LoggerService,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ShopifyInterceptor } from 'src/interceptors/shopify.interceptor';
import { ShopifyWebhookService } from './shopify-webhook.service';

@Controller('shopify-webhook')
@UseInterceptors(ShopifyInterceptor)
export class ShopifyWebhookController {
  constructor(
    private readonly shopifyWebhookService: ShopifyWebhookService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}
  /**
   * Webhook for users created an order on Shopify
   * @param req Request information
   * @param body Webhook body
   * @returns Webhook successfully received
   */
  @Post('orders/create')
  async onReceiveOrderCreate(@Headers() headers: Headers, @Body() body: any) {
    try {
      // Log incoming request body
      this.logger.debug(body);
      // Is testing
      const isTest = headers['x-shopify-test'] === 'true';
      // Check Shopify version
      const webhookVersion = headers['x-shopify-api-version'];
      switch (webhookVersion) {
        case process.env.API_VERSION:
        case '2021-10':
        case '2021-07':
          if (!isTest)
            this.shopifyWebhookService.updateChickeeDuckInventory(body);
          break;
        default:
          throw new BadRequestException('Unsupported Shopify API version');
      }
      return true;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}
