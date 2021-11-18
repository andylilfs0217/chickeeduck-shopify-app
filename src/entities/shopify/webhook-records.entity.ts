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
  body?: string;
  orderPlaced?: boolean;
}

@Entity()
export class TWebhookRecords {
  /** Shopify product variant ID */
  @PrimaryColumn()
  trxNo: string;

  @Column()
  body: string;

  @Column({ default: false })
  orderPlaced: boolean;

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
