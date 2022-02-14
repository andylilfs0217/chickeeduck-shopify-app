import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async findAll(limit = 30, page = 0) {
    return await this.repo.findAndCount({
      order: { trxNo: 'DESC' },
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
}
