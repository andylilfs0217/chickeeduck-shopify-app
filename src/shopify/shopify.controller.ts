import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import Shopify, { ApiVersion } from '@shopify/shopify-api';
import { IncomingMessage, ServerResponse } from 'http';
import { ShopifyService } from './shopify.service';

@Controller('shopify')
export class ShopifyController {
  constructor(private readonly shopifyService: ShopifyService) {}

  /**
   * Create a webhook to ChickeeDuck Shopify
   * @param body Request body
   * @returns Response of creating a webhook to ChickeeDuck Shopify
   */
  @Post('webhooks')
  createWebhook(@Body() body) {
    try {
      const topic: string = body.topic;
      const implementedTopics = ['orders/create'];
      if (implementedTopics.includes(topic))
        return this.shopifyService.createWebhook(topic);
      else if (!!topic)
        throw new NotFoundException(
          'Your webhook topic subscription has not been implemented yet',
        );
      else
        throw new NotFoundException('Webhook subscription must not be empty');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get the details of a specific webhook
   * @param webhookId Shopify Webhook ID
   * @returns The details of the webhook
   */
  @Get('webhooks/:id')
  getWebhook(@Param('id') webhookId: string) {
    try {
      return this.shopifyService.getWebhook(webhookId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get the details all webhooks
   * @returns The details of all webhooks
   */
  @Get('webhooks')
  getWebhooks(@Query('since_id') sinceId: string) {
    try {
      return this.shopifyService.getWebhooks(sinceId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get the number of webhooks in active of a specific webhook topic.\
   * If `topic` is null, all webhooks will be queried.
   * @param topic A webhook topic
   * @returns The number of webhooks in active
   */
  @Get('webhooks/count')
  getWebhooksCount(@Query('topic') topic: string) {
    try {
      return this.shopifyService.getWebhooksCount(topic);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a specific webhook
   * @param webhookId Shopify webhook ID
   * @returns Empty object
   */
  @Delete('webhooks/:id')
  deleteWebhook(@Param('id') webhookId: string) {
    try {
      return this.shopifyService.deleteWebhook(webhookId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Modify Shopify webhook subscription's topic or address URIs
   * @param webhookId Shopify webhook ID
   * @param body An object containing webhook subscription's topic or address URIs
   * @returns Empty object
   */
  @Put('webhooks/:id')
  modifyWebhook(@Param('id') webhookId: string, @Body() body: any) {
    try {
      return this.shopifyService.modifyWebhook(webhookId, body);
    } catch (error) {
      throw error;
    }
  }

  // FOR TESTING

  /**
   * Get all orders on ChickeeDuck Shopify
   * @returns All Shopify orders
   */
  @Get('orders')
  async getAllOrders(@Req() req: IncomingMessage, @Res() res: ServerResponse) {
    try {
      const { API_KEY, PASSWORD, HOSTNAME, SCOPES } = process.env;
      Shopify.Context.initialize({
        API_KEY,
        API_SECRET_KEY: PASSWORD,
        SCOPES: [SCOPES],
        HOST_NAME: HOSTNAME,
        IS_EMBEDDED_APP: false,
        IS_PRIVATE_APP: true,
        API_VERSION: ApiVersion.July21,
      });
      const session = await Shopify.Utils.loadCurrentSession(req, res);
      const client = new Shopify.Clients.Rest(
        session.shop,
        session.accessToken ?? '',
      );
      const products = await client.get({
        path: 'products',
      });
      return products;
      // return this.shopifyService.getAllOrders();
    } catch (error) {
      throw error;
    }
  }
}
