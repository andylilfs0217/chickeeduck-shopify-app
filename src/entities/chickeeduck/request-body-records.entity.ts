import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TRequestBodyData } from './request-body-data.entity';
import { TRequestBodyHeaders } from './request-body-headers.entity';
import { TRequestBodyPayments } from './request-body-payments.entity';

export interface RequestBodyRecordDto {
  trxNo: string;
  body?: any;
  orderPlaced?: number;
}

@Entity()
export class TRequestBodyRecords {
  /** Shopify product variant ID */
  @PrimaryColumn()
  trxNo: string;

  @Column({ nullable: true })
  loginID: string;

  @Column({ nullable: true })
  procID: string;

  @Column({ nullable: true })
  funcNo: string;

  @Column({ nullable: true })
  funcType: number;

  @Column({ nullable: true })
  funcTableType: number;

  @Column({ nullable: true })
  pmtID: number;

  @Column({ nullable: true })
  window__action: string;

  @Column({ nullable: true })
  window__action_target: string;

  @Column({ nullable: true })
  numberParms: string;

  @Column({ nullable: true })
  datetimeParms: string;

  @OneToMany(() => TRequestBodyData, (data) => data.record, {
    onDelete: 'CASCADE',
  })
  data: TRequestBodyData[];

  @OneToOne(() => TRequestBodyHeaders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  header: TRequestBodyHeaders;

  @OneToMany(() => TRequestBodyPayments, (payment) => payment.record, {
    onDelete: 'CASCADE',
  })
  payments: TRequestBodyPayments[];

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
