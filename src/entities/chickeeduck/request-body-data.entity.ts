import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { TRequestBodyRecords } from './request-body-records.entity';

@Entity()
export class TRequestBodyData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  dis_amt: number;

  @Column({ nullable: true })
  item_code: string;

  @Column({ nullable: true })
  item_discount: number;

  @Column({ nullable: true })
  item_name: string;

  @Column({ nullable: true })
  item_qty: number;

  @Column({ nullable: true })
  line_no: number;

  @Column({ nullable: true })
  mem_a_dis: number;

  @Column({ nullable: true })
  salesman_code: string;

  @Column({ nullable: true })
  sh_code: string;

  @ManyToOne(() => TRequestBodyRecords, (record) => record.data, {
    onDelete: 'CASCADE',
  })
  record: TRequestBodyRecords;

  @Column({ nullable: true })
  trx_sub_amt: number;

  @Column({ nullable: true })
  trx_sub_disamt: number;

  @Column({ nullable: true })
  trx_type: string;

  @Column({ nullable: true })
  unit_price: string;

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
