import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TWebhookRecords,
  WebhookRecordDto,
} from 'src/entities/shopify/webhook-records.entity';

@Injectable()
export class ShopifyWebhookRecordService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(TWebhookRecords)
    private repo: Repository<TWebhookRecords>,
  ) {}

  async findOne(record: WebhookRecordDto) {
    return await this.repo.findOne(record.trxNo);
  }

  async findAll() {
    return await this.repo.find();
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
    const orders = await this.repo.find({
      where: {
        orderPlaced: false,
      },
    });
    return orders;
  }
}
