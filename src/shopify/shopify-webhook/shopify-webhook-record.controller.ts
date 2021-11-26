import { Controller, Get, Param, Post } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ShopifyWebhookRecordService } from './shopify-webhook-record.service';
import { ShopifyWebhookService } from './shopify-webhook.service';

@Controller('shopify-webhook-record')
export class ShopifyWebhookRecordController {
  constructor(
    private repo: ShopifyWebhookRecordService,
    private shopifyWebhookService: ShopifyWebhookService,
  ) {}

  @Get(':trxNo')
  async getOne(@Param('trxNo') trxNo: string) {
    const res = await this.repo.findOne({ trxNo });
    return res;
  }

  @Get()
  async getAll() {
    const res = await this.repo.findAll();
    return res;
  }

  @Get('find/incomplete-orders')
  async getAllIncompleteOrders() {
    const res = await this.repo.findAllIncompleteOrder();
    return res;
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  @Post('incomplete-orders')
  async placeIncompleteOrders() {
    const orders = await this.repo.findAllIncompleteOrder();
    for await (const order of orders[0]) {
      await this.shopifyWebhookService.updateChickeeDuckInventory(order.body);
    }
    const res = {
      message: `Updated incomplete orders. (Total orders: ${orders[0].length})`,
    };
    return res;
  }
}
