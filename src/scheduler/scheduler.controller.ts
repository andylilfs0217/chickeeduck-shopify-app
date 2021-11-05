import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  InternalServerErrorException,
  LoggerService,
  Put,
} from '@nestjs/common';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ShopifyProductVariantDto } from 'src/entities/shopify/products.entity';
import { SchedulerService } from './scheduler.service';

@Controller('scheduler')
export class SchedulerController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private schedulerService: SchedulerService,
  ) {}

  /**
   * Get all products in Shopify
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

            const updateData = await this.schedulerService.upsertVariant(dto);
          } catch (error) {}
        });
      });
      return products;
    } catch (error) {
      throw error;
    }
  }

  // @Cron('0 0 0 * * *')
  @Put('inventory')
  async updateShopifyInventory(@Body() body: any) {
    try {
      this.logger.log('Update Shopify inventory');
      // TODO: Fetch inventories from ChickeeDuck server
      // Get item SKU and available inventory of items
      const sku: string = body.sku;
      const available = body.inventory;
      if (sku === null || available === null)
        throw new BadRequestException(
          'Missing item SKU or inventory level in the request body',
        );

      // Get inventory_item_id
      const query: any = {
        productBarcode: sku,
      };
      const shopifyProduct = await this.schedulerService.findShopifyProduct(
        query,
      );
      const inventoryItemId = shopifyProduct.shopifyVariantInventoryItemId;
      const inventoryItemDetails: Array<any> =
        await this.schedulerService.getInventoryItemDetails(inventoryItemId);
      const inventoryItemDetail =
        inventoryItemDetails.length > 0 ? inventoryItemDetails[0] : null;
      const locationId = inventoryItemDetail?.location_id;
      const oldInventory = inventoryItemDetail?.available;

      if (locationId !== null && oldInventory !== null) {
        // Update inventory
        let data: any = { message: 'Inventory is update to date' };
        if (oldInventory !== available)
          data = await this.schedulerService.updateShopifyInventoryItem(
            locationId,
            inventoryItemId,
            available,
          );
        return data;
      }
      throw new InternalServerErrorException('Cannot update Shopify inventory');
    } catch (error) {
      throw error;
    }
  }
}
