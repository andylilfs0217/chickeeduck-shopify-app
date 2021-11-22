import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TRequestBodyData } from 'src/entities/chickeeduck/request-body-data.entity';
import { TRequestBodyHeaders } from 'src/entities/chickeeduck/request-body-headers.entity';
import { TRequestBodyPayments } from 'src/entities/chickeeduck/request-body-payments.entity';
import { TRequestBodyRecords } from 'src/entities/chickeeduck/request-body-records.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ChickeeDuckRequestRecordsService {
  constructor(
    @InjectRepository(TRequestBodyRecords)
    private recordRepo: Repository<TRequestBodyRecords>,
    @InjectRepository(TRequestBodyData)
    private dataRepo: Repository<TRequestBodyData>,
    @InjectRepository(TRequestBodyHeaders)
    private headerRepo: Repository<TRequestBodyHeaders>,
    @InjectRepository(TRequestBodyPayments)
    private paymentRepo: Repository<TRequestBodyPayments>,
  ) {}

  public async findAll() {
    const builder = this.recordRepo.createQueryBuilder('p');
    builder.leftJoinAndSelect('p.header', 'header');
    builder.leftJoinAndSelect('p.data', 'data');
    builder.leftJoinAndSelect('p.payments', 'payments');
    return await builder.getManyAndCount();
  }

  public async findOneByTrxNo(trxNo: string) {
    const builder = this.recordRepo.createQueryBuilder('p');
    builder.where('trxNo = :trxNo', { trxNo: trxNo });
    builder.leftJoinAndSelect('p.header', 'header');
    builder.leftJoinAndSelect('p.data', 'data');
    builder.leftJoinAndSelect('p.payments', 'payments');
    return await builder.getOne();
  }

  public async saveRequestBody(body: any, data: string) {
    try {
      const dataJson = JSON.parse(data);
      const trxNo = dataJson['hdr']['trx_no'];
      // Header
      dataJson['hdr']['record'] = { trxNo: trxNo };
      const header = await this.headerRepo.insert(dataJson['hdr']);
      // Record
      this.recordRepo.insert({
        trxNo: trxNo,
        loginID: body['loginID'],
        procID: body['procID'],
        funcNo: body['funcNo'],
        funcType: body['funcType'],
        funcTableType: body['funcTableType'],
        pmtID: body['pmtID'],
        numberParms: body['numberParms'],
        datetimeParms: body['datetimeParms'],
        window__action: body['stringParms'][0]['Value'],
        window__action_target: body['stringParms'][1]['Value'],
        header: header.identifiers[0],
      });
      // Data
      for (const dat of dataJson['dat']) {
        dat['record'] = { trxNo: trxNo };
        this.dataRepo.insert(dat);
      }
      // Payment
      for (const pay of dataJson['pay']) {
        pay['record'] = { trxNo: trxNo };
        this.paymentRepo.insert(pay);
      }
      return true;
    } catch (error) {
      throw error;
    }
  }
}
