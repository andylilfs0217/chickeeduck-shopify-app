import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import Shopify from '@shopify/shopify-api';
import { catchError, map } from 'rxjs';
import { PathUtils } from 'src/utils/path.utils';

@Injectable()
export class ShopifyService {
  constructor(private httpService: HttpService) {}

  /**
   * Create a webhook to ChickeeDuck Shopify
   * @param topic A webhook subscription topic
   * @returns Create webhook response
   */
  createWebhook(topic: string) {
    try {
      const body = {
        webhook: {
          topic: topic,
          address: `${process.env.SERVER_URL}/shopify-webhook/${topic}`,
          format: 'json',
        },
      };
      return this.httpService
        .post(PathUtils.getChickeeDuckShopifyAdminAPI('webhooks'), body)
        .pipe(
          map((res) => res.data),
          catchError((e) => {
            throw new HttpException(e.response.data, e.response.status);
          }),
        );
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
      return this.httpService
        .get(PathUtils.getChickeeDuckShopifyAdminAPI('orders'))
        .pipe(
          map((res) => res.data),
          catchError((e) => {
            throw new HttpException(e.response.data, e.response.status);
          }),
        );
      // const session = await Shopify.Utils.loadCurrentSession(req, res);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get the details of a specific webhook
   * @param webhookId Shopify webhook ID
   * @returns Details of the webhook
   */
  getWebhook(webhookId: string) {
    try {
      return this.httpService
        .get(PathUtils.getChickeeDuckShopifyAdminAPI(`webhooks/${webhookId}`))
        .pipe(
          map((res) => res.data),
          catchError((e) => {
            throw new HttpException(e.response.data, e.response.status);
          }),
        );
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
  getWebhooks(sinceId: string) {
    try {
      return this.httpService
        .get(PathUtils.getChickeeDuckShopifyAdminAPI(`webhooks`), {
          params: { since_id: sinceId },
        })
        .pipe(
          map((res) => res.data),
          catchError((e) => {
            throw new HttpException(e.response.data, e.response.status);
          }),
        );
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
  getWebhooksCount(topic: string) {
    try {
      return this.httpService
        .get(PathUtils.getChickeeDuckShopifyAdminAPI(`webhooks/count`), {
          params: {
            topic: topic,
          },
        })
        .pipe(
          map((res) => res.data),
          catchError((e) => {
            throw new HttpException(e.response.data, e.response.status);
          }),
        );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a specific shopify webhook
   * @param webhookId Shopify webhook ID
   * @returns Empty object
   */
  deleteWebhook(webhookId: string) {
    try {
      return this.httpService
        .delete(
          PathUtils.getChickeeDuckShopifyAdminAPI(`webhooks/${webhookId}`),
        )
        .pipe(
          map((res) => res.data),
          catchError((e) => {
            throw new HttpException(e.response.data, e.response.status);
          }),
        );
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
  modifyWebhook(webhookId: string, body: any) {
    try {
      return this.httpService
        .put(
          PathUtils.getChickeeDuckShopifyAdminAPI(`webhooks/${webhookId}`),
          body,
        )
        .pipe(
          map((res) => res.data),
          catchError((e) => {
            throw new HttpException(e.response.data, e.response.status);
          }),
        );
    } catch (error) {
      throw error;
    }
  }
}
