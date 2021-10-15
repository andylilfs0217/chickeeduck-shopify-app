import { Injectable } from '@nestjs/common';
import Shopify, { DataType } from '@shopify/shopify-api';
import { RestClient } from '@shopify/shopify-api/dist/clients/rest';

@Injectable()
export class ShopifyService {
  client: RestClient;
  API_VERSION: string;
  constructor() {
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
  async getAllOrders() {
    try {
      const data = await this.client.get({
        path: 'orders',
        query: {
          api_version: this.API_VERSION,
        },
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
}
