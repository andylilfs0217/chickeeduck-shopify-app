import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface WebhookRecordDto {
  trxNo: string;
  body?: any;
  orderPlaced?: number;
}

@Entity()
export class TWebhookRecords {
  /** Shopify product variant ID */
  @PrimaryColumn()
  trxNo: string;

  @Column({ type: 'json' })
  body: any;

  @Column({ default: 0, type: 'tinyint' })
  orderPlaced: number;

  /** Entity created date */
  @CreateDateColumn()
  createdDate: Date;

  /** Entity updated date */
  @UpdateDateColumn()
  updatedDate: Date;

  /** Entity deleted date */
  @DeleteDateColumn()
  deletedDate: Date;
}
