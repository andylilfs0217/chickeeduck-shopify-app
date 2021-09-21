import { Controller, Get, Post } from '@nestjs/common';
import { ShopifyService } from './shopify.service';

@Controller('shopify')
export class ShopifyController {
  constructor(private readonly shopifyService: ShopifyService) {}

  /**
   * Create a webhook to ChickeeDuck Shopify
   * @returns Response of creating a webhook to ChickeeDuck Shopify
   */
  @Post('create-webhook')
  createWebhook() {
    try {
      return this.shopifyService.createWebhook();
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Get all orders on ChickeeDuck Shopify
   * @returns All Shopify orders
   */
  @Get('orders')
  getAllOrders() {
    try {
      return this.shopifyService.getAllOrders();
    } catch (error) {
      throw new Error(error);
    }
  }
}
