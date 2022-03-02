import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryBuilder, Repository } from 'typeorm';
import {
  TWebhookRecords,
  WebhookRecordDto,
} from 'src/entities/shopify/webhook-records.entity';

@Injectable()
export class ShopifyWebhookRecordService {
  constructor(
    @InjectRepository(TWebhookRecords)
    private repo: Repository<TWebhookRecords>,
  ) {}

  async findOne(record: WebhookRecordDto) {
    return await this.repo.findOne(record.trxNo);
  }

  async findAll(limit = 30, page = 0, order = 'DESC') {
    return await this.repo.findAndCount({
      order: { trxNo: order },
      take: limit,
      page: page,
    } as any);
  }

  async upsertOne(record: WebhookRecordDto) {
    const oldRecord = await this.findOne(record);
    if (!!oldRecord) {
      await this.repo.update(record.trxNo, record);
    } else {
      await this.repo.insert(record);
    }
    const newRecord = await this.findOne(record);
    return newRecord;
  }

  async findAllIncompleteOrder() {
    const orders = await this.repo.findAndCount({
      where: {
        orderPlaced: 0,
      },
    });
    return orders;
  }

  async getPriceAndPayment(fromTrxNo: string, toTrxNo?: string) {
    const qb = this.repo
      .createQueryBuilder('p')
      .select()
      .where('p.trxNo >= :fromTrxNo', { fromTrxNo });
    if (toTrxNo && toTrxNo.length > 0)
      qb.andWhere('p.trxNo <= :toTrxNo', { toTrxNo });
    const orders: any[] = await qb.getMany();
    const res = [];
    for (const order of orders) {
      const trxNo = order.trxNo;
      for (const item of order.body.line_items) {
        const sku = item.sku;
        const price = item.price * item.quantity - item.total_discount;
        let tempDiscount = 0;
        item['discount_allocations'].forEach(
          (discount: any) => (tempDiscount += discount['amount']),
        );
        const dis_amt =
          (item['price'] - tempDiscount) * item['quantity'] -
          item['total_discount'];
        const obj = {
          trxNo,
          sku,
          price,
          dis_amt,
        };
        res.push(obj);
      }
    }
    return res;
  }
}
