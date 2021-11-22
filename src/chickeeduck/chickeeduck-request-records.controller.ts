import { Controller, Get, Param } from '@nestjs/common';
import { ChickeeDuckRequestRecordsService } from './chickeeduck-request-records.service';

@Controller('chickeeduck-request-records')
export class ChickeeDuckRequestRecordsController {
  constructor(private repo: ChickeeDuckRequestRecordsService) {}

  @Get('')
  async getAllRecords() {
    try {
      return await this.repo.findAll();
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  async getRecordByTrxNo(@Param('id') id: string) {
    try {
      return await this.repo.findOneByTrxNo(id);
    } catch (error) {
      throw error;
    }
  }
}
