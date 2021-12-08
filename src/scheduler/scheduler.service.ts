import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Shopify, { DataType } from '@shopify/shopify-api';
import { RestClient } from '@shopify/shopify-api/dist/clients/rest';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { lastValueFrom } from 'rxjs';
import { ChickeeDuckService } from 'src/chickeeduck/chickeeduck.service';
import {
  ShopifyProductVariantDto,
  TShopifyProductVariants,
} from 'src/entities/shopify/products.entity';
import { ShopifyUtils } from 'src/utils/shopify.utils';
import { Repository } from 'typeorm';

export enum ShopifyUpdateStatus {
  updated,
  upToDate,
  notUpdated,
  notFound,
}

@Injectable()
export class SchedulerService {
  client: RestClient;
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(TShopifyProductVariants)
    private repo: Repository<TShopifyProductVariants>,
    private chickeeDuckService: ChickeeDuckService,
  ) {
    this.client = new Shopify.Clients.Rest(
      process.env.HOSTNAME,
      process.env.PASSWORD,
    );
  }

  async updateVariantInventory(sku: string, inventory: number) {
    try {
      // Find one
      const data = await this.repo
        .createQueryBuilder('p')
        .where('productSKU = :sku', { sku: sku })
        .orWhere('productBarcode = :sku', { sku: sku })
        .getOne();

      let upsertData: any;
      if (data) {
        // Add inventory
        data.productInventory = inventory;
        // Update record
        upsertData = await this.repo
          .createQueryBuilder()
          .update()
          .set(data)
          .where('id = :id', { id: data.id })
          .execute();
      }

      return upsertData;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get products and inventories from ChickeeDuck server
   * @returns Inventory and products from ChickeeDuck
   */
  async getInventoryFromChickeeDuck() {
    let loginID: string;
    try {
      // Login to ChickeeDuck server
      const loginRes = await lastValueFrom(
        this.chickeeDuckService.loginChickeeDuckServer(
          process.env.CHICKEEDUCK_LOGIN_USERNAME,
          process.env.CHICKEEDUCK_LOGIN_PASSWORD,
        ),
      );
      if (loginRes['Data'] === true) {
        loginID = loginRes['WarningMsg'][0] as string;
        this.logger.log(`Login ID: ${loginID}`);
      } else {
        if (!!loginRes['Error'])
          this.logger.error(`${loginRes['Error']['ErrMsg']}`);
        throw Error('Log in to ChickeeDuck unsuccessful');
      }

      // Lock Product
      const lockProcRes = await lastValueFrom(
        this.chickeeDuckService.lockProc(
          loginID,
          process.env.CHICKEEDUCK_USER_ID,
          process.env.CHICKEEDUCK_USER_PASSWORD,
        ),
      );
      const procID = lockProcRes['Data'];
      this.logger.log(`Proc ID: ${procID}`);

      // Generate order for ChickeeDuck server from [data]
      const dataJson = {
        retrieve: 'SW004',
      };
      const dataString = JSON.stringify(dataJson);

      // Get inventory details from ChickeeDuck server
      const target = 'WH_BAL';
      const windowAction = 'get__window_data';
      const updateData = await lastValueFrom(
        this.chickeeDuckService.updateData(
          loginID,
          procID,
          windowAction,
          target,
          dataString,
        ),
      );
      if (
        updateData['Data'] === null &&
        updateData['Error'] !== null &&
        updateData['Error']['ErrCode'] === -1
      ) {
        this.logger.error(
          'Update ChickeeDuck database failed: ' +
            updateData['Error']['ErrMsg'],
        );
      }

      // Unlock Product
      await lastValueFrom(this.chickeeDuckService.unlockProc(loginID, procID));

      return updateData['Data'];
    } catch (error) {
      throw error;
    } finally {
      // Logout from ChickeeDuck server
      await lastValueFrom(
        this.chickeeDuckService.logoutChickeeDuckServer(loginID),
      );
      this.logger.log(`Logged out`);
    }
  }

  /**
   * Get all products in Shopify and update TShopifyProducts
   * @returns A list of product details
   */
  async getAllProducts() {
    try {
      let products = [];
      let isFinished = false;
      let query = {
        limit: 250,
      };
      while (!isFinished) {
        const res = await this.client.get({
          path: 'products',
          query: query,
        });
        const body = res.body as any;
        const headers = res.headers;
        const pagination = ShopifyUtils.parseLinkHeader(headers.get('link'));
        const next = pagination.next;

        // Store the list of products
        const productsPart = body.products as Array<any>;
        products = products.concat(productsPart);

        // Continue to get products if there is next page
        isFinished = !next;
        if (!isFinished) {
          query = next.query;
        }
      }
      return products;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a product variant in the server database
   * @param variant Shopify product variant
   * @returns Updated product variant
   */
  async upsertVariant(variant: ShopifyProductVariantDto) {
    try {
      // Find one
      let data: any = await this.repo.findOne(variant.id);

      if (!data) {
        // Create record
        data = await this.repo
          .createQueryBuilder()
          .insert()
          .values(variant)
          .execute();
      } else {
        // Update record
        data = await this.repo
          .createQueryBuilder()
          .update()
          .set(variant)
          .where('id = :id', { id: variant.id })
          .execute();
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a list of product variants in the server database
   * @param variants List of Shopify product variants
   * @returns Updated product variants
   */
  async upsertVariants(variants: ShopifyProductVariantDto[]) {
    try {
      const data = await this.repo
        .save(variants)
        .catch((e) => this.logger.error(e.message));
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find a specific product variant in the server
   * @param query Find one query
   * @returns A product variant
   */
  async findShopifyProduct(sku: string) {
    try {
      const builder = this.repo
        .createQueryBuilder('p')
        .where('p.productSKU = :sku', { sku: sku })
        .orWhere('p.productBarcode = :sku', { sku: sku });
      return await builder.getOne();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get the details of the inventory level of a specific product
   * @param inventoryItemId Inventory item ID
   * @returns Details of the inventory level of the product
   */
  async getInventoryItemDetails(inventoryItemId: number) {
    try {
      let inventoryLevelDetails = [];
      let isFinished = false;
      let query = {
        limit: 50,
        inventory_item_ids: inventoryItemId,
      };
      while (!isFinished) {
        const res = await this.client.get({
          path: 'inventory_levels',
          query: query,
        });
        const body = res.body as any;
        const headers = res.headers;
        const link = headers.get('link');
        const pagination = link
          ? ShopifyUtils.parseLinkHeader(headers.get('link'))
          : null;
        const next = pagination?.next;

        // Store the list of products
        const inventoryLevelPart = body.inventory_levels as Array<any>;
        inventoryLevelDetails =
          inventoryLevelDetails.concat(inventoryLevelPart);

        // Continue to get products if there is next page
        isFinished = !next;
        if (!isFinished) {
          query = next.query;
        }
      }
      return inventoryLevelDetails;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update Shopify product inventory
   * @param sku Product SKU
   * @param available Number of products available to be set
   * @returns Updated Shopify product if inventory levels are updated. [false] otherwise.
   */
  async updateShopifyInventoryItem(sku: string, available: number | string) {
    try {
      const result = {
        message: null,
        data: null,
        status: ShopifyUpdateStatus.notFound,
      };
      const shopifyProduct = await this.findShopifyProduct(sku);
      if (!shopifyProduct) {
        result.message = `Product ${sku} not found in database`;
        this.logger.error(result.message);
        return result;
      }
      const inventoryItemId = shopifyProduct.shopifyVariantInventoryItemId;
      const inventoryItemDetails: Array<any> =
        await this.getInventoryItemDetails(inventoryItemId);
      const inventoryItemDetail =
        inventoryItemDetails.length > 0 ? inventoryItemDetails[0] : null;
      const locationId = inventoryItemDetail?.location_id;
      const oldInventory = inventoryItemDetail?.available;

      if (locationId !== null && oldInventory !== null) {
        // Update inventory
        if (oldInventory !== available) {
          // Update Shopify inventory
          if (process.env.NODE_ENV !== 'production') {
            // The environment is not in production, no actual action executed
            result.message =
              'This server is not in production. No actions are being executed';
          } else {
            // The environment is in production, update inventory level in Shopify
            // TODO: uncomment for production
            result.data = (
              await this.client.post({
                path: 'inventory_levels/set',
                data: {
                  location_id: locationId,
                  inventory_item_id: inventoryItemId,
                  available: available,
                },
                type: DataType.JSON,
              })
            ).body;
            result.message = `Updated product SKU: \"${sku}\", Name: \"${shopifyProduct.shopifyProductTitle}\". (Original quantity: ${oldInventory}, Quantity: ${available})`;
          }
          result.status = ShopifyUpdateStatus.updated;
        } else {
          result.message = `Product SKU: \"${sku}\", Name: \"${shopifyProduct.shopifyProductTitle}\" is up-to-date. (Quantity: ${available})`;
          result.status = ShopifyUpdateStatus.upToDate;
        }
      } else {
        result.message = `Cannot update product SKU: \"${sku}\", Name: \"${shopifyProduct.shopifyProductTitle}\".`;
        result.status = ShopifyUpdateStatus.notUpdated;
      }
      if (!!result.message) this.logger.log(result.message);
      return result;
    } catch (error) {
      throw error;
    }
  }
}
