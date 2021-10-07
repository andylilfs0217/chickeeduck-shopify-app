import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Shopify, { DataType } from '@shopify/shopify-api';
import { RestClient } from '@shopify/shopify-api/dist/clients/rest';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import {
  ShopifyProductVariantDto,
  TShopifyProductVariants,
} from 'src/entities/shopify/products.entity';
import { ShopifyUtils } from 'src/utils/shopify.utils';
import { Repository } from 'typeorm';

@Injectable()
export class SchedulerService {
  client: RestClient;
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(TShopifyProductVariants)
    private repo: Repository<TShopifyProductVariants>,
  ) {
    this.client = new Shopify.Clients.Rest(
      process.env.HOSTNAME,
      process.env.PASSWORD,
    );
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

  async upsertVariant(variant: ShopifyProductVariantDto) {
    try {
      // // const data = await this.repo
      // //   .save(variant)
      // //   .catch((e) => this.logger.error(e.message));
      // // return data;
      // const builder = this.repo.createQueryBuilder().insert().values(variant);
      // // .where('id = :id', { id: variant.id });
      // const data = await builder.execute();
      // return data;

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

  async findShopifyProduct(query: any) {
    try {
      return await this.repo.findOne(query);
    } catch (error) {
      throw error;
    }
  }

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

  async updateShopifyInventoryItem(
    locationId: number,
    inventoryItemId: number,
    available: number,
  ) {
    try {
      const data = await this.client.post({
        path: 'inventory_levels/set',
        data: {
          location_id: locationId,
          inventory_item_id: inventoryItemId,
          available: available,
        },
        type: DataType.JSON,
      });
      return data.body;
    } catch (error) {
      throw error;
    }
  }
}
