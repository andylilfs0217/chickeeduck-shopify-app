import { Injectable } from '@nestjs/common';
import Shopify, { DataType } from '@shopify/shopify-api';
import { RestClient } from '@shopify/shopify-api/dist/clients/rest';
import { ShopifyUtils } from 'src/utils/shopify.utils';
import { ShopifyWebhookService } from './shopify-webhook/shopify-webhook.service';

@Injectable()
export class ShopifyService {
  client: RestClient;
  API_VERSION: string;
  constructor(private shopifyWebhookService: ShopifyWebhookService) {
    this.API_VERSION = process.env.API_VERSION;
    this.client = new Shopify.Clients.Rest(
      process.env.HOSTNAME,
      process.env.PASSWORD,
    );
  }

  /**
   * Create a webhook to ChickeeDuck Shopify
   * @param topic A webhook subscription topic
   * @returns Create webhook response
   */
  async createWebhook(topic: string) {
    try {
      const body = {
        webhook: {
          topic: topic,
          address: `${process.env.SERVER_URL}/shopify-webhook/${topic}`,
          format: 'json',
        },
      };
      const data = await this.client.post({
        path: `webhooks`,
        data: body,
        type: DataType.JSON,
      });
      return data.body;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all orders on ChickeeDuck Shopify
   * @returns All Shopify orders
   */
  async getAllOrders(
    createdAtMin?: string,
    createdAtMax?: string,
    fields?: string,
    status = 'any',
  ) {
    try {
      const query: any = { api_version: this.API_VERSION, status: status };
      if (createdAtMin) query.created_at_min = createdAtMin;
      if (createdAtMax) query.created_at_max = createdAtMax;
      if (fields) query.fields = fields;
      const data = await this.client.get({
        path: 'orders',
        query: query,
      });
      return data.body;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get the details of a specific webhook
   * @param webhookId Shopify webhook ID
   * @returns Details of the webhook
   */
  async getWebhook(webhookId: string) {
    try {
      const data = await this.client.get({ path: `webhooks/${webhookId}` });
      return data.body;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get the details of all webhooks after a specific webhook ID.\
   * Get all webhooks if `sinceId` is null.
   * @param sinceId A webhook ID
   * @returns Details of webhooks
   */
  async getWebhooks(sinceId: string) {
    try {
      const data = await this.client.get({
        path: `webhooks`,
        query: { since_id: sinceId },
      });
      return data.body;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get the number of webhooks in active of a specific webhook topic.\
   * If `topic` is null, all webhooks will be queried.
   * @param topic A webhook topic
   * @returns The number of webhooks
   */
  async getWebhooksCount(topic: string) {
    try {
      const data = await this.client.get({
        path: `webhooks/count`,
        query: { topic: topic },
      });
      return data.body;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a specific shopify webhook
   * @param webhookId Shopify webhook ID
   * @returns Empty object
   */
  async deleteWebhook(webhookId: string) {
    try {
      const data = await this.client.delete({ path: `webhooks/${webhookId}` });
      return data.body;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update Shopify webhook subscription's topic or address URIs
   * @param webhookId Webhook ID
   * @param body Webhook details
   * @returns Updated Webhook details`
   */
  async modifyWebhook(webhookId: string, body: any) {
    try {
      const data = await this.client.put({
        path: `webhooks/${webhookId}`,
        data: body,
        type: DataType.JSON,
      });
      return data.body;
    } catch (error) {
      throw error;
    }
  }

  async getActiveProducts() {
    try {
      let activeProducts = [];
      let isFinished = false;
      let query = {
        limit: 250,
        published_status: 'published',
        status: 'active',
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
        activeProducts = activeProducts.concat(productsPart);

        // Continue to get products if there is next page
        isFinished = !next;
        if (!isFinished) {
          query = next.query;
        }
      }
      return activeProducts;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a specific order
   * @param id Order ID in Shopify
   * @param fields Desired fields of the order (optional)
   * @returns Order details
   */
  async getOrder(id: string, fields?: string) {
    try {
      const query: any = { api_version: this.API_VERSION };
      if (fields) query.fields = fields;
      const data = await this.client.get({
        path: `orders/${id}`,
        query: query,
      });
      return data.body;
    } catch (error) {
      return error;
    }
  }

  /**
   * Create an order in ChickeeDuck server by getting the information from Shopify
   * @param id Order ID in Shopify
   */
  async createOrderToChickeeDuckServer(id: string) {
    try {
      const order = await this.getOrder(id);
      await this.shopifyWebhookService.updateChickeeDuckInventory(order.order);
      return order;
    } catch (error) {
      throw error;
    }
  }
}
