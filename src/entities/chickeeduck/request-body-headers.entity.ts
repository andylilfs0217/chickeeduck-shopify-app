import {
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { TRequestBodyRecords } from './request-body-records.entity';

@Entity()
export class TRequestBodyHeaders {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  trx_type: string;
  @Column({ nullable: true })
  doc_type: string;
  @Column({ nullable: true })
  trx_date: string;
  @Column({ nullable: true })
  user_member: string;
  @Column({ nullable: true })
  curr_code: string;
  @Column({ nullable: true })
  exch_rate: number;
  @Column({ nullable: true })
  trx_bas_amt: number;
  @Column({ nullable: true })
  trx_status: string;
  @Column({ nullable: true })
  sh_code: string;
  @Column({ nullable: true })
  wh_code_from: string;
  @Column({ nullable: true })
  wh_code_to: string;
  @Column({ nullable: true })
  salesman_code: string;
  @Column({ nullable: true })
  chg_rate: number;
  @Column({ nullable: true })
  cashier: string;
  @Column({ nullable: true })
  cashi_no: string;

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
