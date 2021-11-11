import {
  Body,
  Controller,
  Inject,
  LoggerService,
  Param,
  Put,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ShopifyProductVariantDto } from 'src/entities/shopify/products.entity';
import { SchedulerService, ShopifyUpdateStatus } from './scheduler.service';

@Controller('scheduler')
export class SchedulerController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private schedulerService: SchedulerService,
  ) {}

  /**
   * Get all products in Shopify at midnight each day
   * @returns A list of products in Shopify
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  @Put('product-variants')
  async updateProductVariants() {
    try {
      this.logger.log(`Update product variants`);
      const products = await this.schedulerService.getAllProducts();
      products.forEach(async (product) => {
        const productId = product.id;
        const productTitle = product.title;
        const variants = product.variants;

        variants.forEach(async (variant: any) => {
          try {
            const variantId = variant.id;
            const inventoryItemId = variant.inventory_item_id;
            const sku = variant.sku;
            const barcode = variant.barcode;
            const variantTitle = variant.title;

            const dto: ShopifyProductVariantDto = {
              id: variantId,
              shopifyProductId: productId,
              shopifyVariantInventoryItemId: inventoryItemId,
              productSKU: sku,
              shopifyProductVariantTitle: variantTitle,
              shopifyProductTitle: productTitle,
              productBarcode: barcode,
            };

            await this.schedulerService.upsertVariant(dto);
          } catch (error) {}
        });
      });
      return products;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update inventory levels of all products in Shopify at 00:10 each day
   * @returns List of updated, up-to-date, and not updated products SKU
   */
  @Cron('10 0 * * *')
  @Put('inventory')
  async updateShopifyInventory() {
    try {
      this.logger.log('Update Shopify inventory');
      // Fetch inventories from ChickeeDuck server
      const inventoryResponse =
        await this.schedulerService.getInventoryFromChickeeDuck();
      const attachedResult = inventoryResponse['AttachedResult'];
      const inventoryListString = attachedResult['ReturnData'];
      const inventoryList = JSON.parse(inventoryListString)[0];
      const result = {
        updated: [],
        upToDate: [],
        notUpdated: [],
      };
      // Get item SKU and available inventory of items
      for await (const item of inventoryList) {
        const sku = item['item_code'];
        const available = item['online_qty'];
        // Get inventory_item_id
        const response = await this.schedulerService.updateShopifyInventoryItem(
          sku,
          available,
        );
        // Store update status
        switch (response.status) {
          case ShopifyUpdateStatus.updated:
            result.updated.push(sku);
            break;
          case ShopifyUpdateStatus.upToDate:
            result.upToDate.push(sku);
            break;
          case ShopifyUpdateStatus.notUpdated:
          case ShopifyUpdateStatus.notFound:
            result.notUpdated.push(sku);
            break;
        }
        if (response.status !== ShopifyUpdateStatus.notFound) {
          // Wait for one second to prevent Shopify request throttling. (Max.: 2 calls per second for api client)
          await new Promise((resolve) => setTimeout(resolve, 501));
        }
      }
      this.logger.log(result);
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a specific product inventory level in Shopify
   * @param sku Product SKU
   * @param body Request body containing available inventory
   * @returns Updated result`1
   */
  @Put('inventory/:sku')
  async updateShopifyInventoryBySku(
    @Param('sku') sku: string,
    @Body() body: any,
  ) {
    try {
      // Get item SKU and available inventory of items
      const available = body['available'];
      // Update inventory in Shopify
      const response = await this.schedulerService.updateShopifyInventoryItem(
        sku,
        available,
      );
      return { message: response.message, data: response.data };
    } catch (error) {
      throw error;
    }
  }
}