import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { TRequestBodyRecords } from './request-body-records.entity';

@Entity()
export class TRequestBodyPayments {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TRequestBodyRecords, (record) => record.payments, {
    onDelete: 'CASCADE',
  })
  record: TRequestBodyRecords;

  @Column({ nullable: true })
  line_no: number;
  @Column({ nullable: true })
  pay_code: string;
  @Column({ nullable: true })
  pay_acc_amt: number;
  @Column({ nullable: true })
  pay_bas_amt: number;
  @Column({ nullable: true })
  curr_code: string;
  @Column({ nullable: true })
  exch_rate: number;
  @Column({ nullable: true })
  is_cash: string;

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
