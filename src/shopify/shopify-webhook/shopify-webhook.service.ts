import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import * as moment from 'moment-timezone';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { InjectRepository } from '@nestjs/typeorm';
import { TShopifyProductVariants } from 'src/entities/shopify/products.entity';
import { Repository } from 'typeorm';
import { ChickeeDuckService } from 'src/chickeeduck/chickeeduck.service';
import { ShopifyWebhookRecordService } from './shopify-webhook-record.service';
import { WebhookRecordDto } from 'src/entities/shopify/webhook-records.entity';

@Injectable()
export class ShopifyWebhookService {
  constructor(
    private httpService: HttpService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(TShopifyProductVariants)
    private repo: Repository<TShopifyProductVariants>,
    private chickeeDuckRepo: ChickeeDuckService,
    private shopifyWebhookRecordRepo: ShopifyWebhookRecordService,
  ) {}

  // Information constants
  salesmanCode = 'D155';
  shCode = 'SW004';
  cashier = 'BOSS';
  cashierNo = 'SW00403';
  orderNoPrefix = 'SW04W';

  /**
   * Update ChickeeDuck inventory in ChickeeDuck server
   * @param data Webhook body from Shopify
   * @returns true
   */
  async updateChickeeDuckInventory(data: any) {
    let loginID: string;
    try {
      // Save webhook from Shopify to the database in case of error
      const trxNo = this.createTrxNo(data['order_number']);
      const webhookRecordDto: WebhookRecordDto = {
        trxNo: trxNo,
        body: data,
        orderPlaced: 0,
      };
      await this.shopifyWebhookRecordRepo.upsertOne(webhookRecordDto);
      // Login to ChickeeDuck server
      const loginRes = await lastValueFrom(
        this.chickeeDuckRepo.loginChickeeDuckServer(
          process.env.CHICKEEDUCK_LOGIN_USERNAME,
          process.env.CHICKEEDUCK_LOGIN_PASSWORD,
        ),
      );
      if (loginRes['Data'] === true) {
        loginID = loginRes['WarningMsg'][0] as string;
        this.logger.log(`Login ID: ${loginID}`);
      } else {
        if (!!loginRes['Error'])
          this.logger.error(`${loginRes['Error']['ErrMsg']}`);
        throw Error('Log in to ChickeeDuck unsuccessful');
      }

      // Lock Product
      const lockProcRes = await lastValueFrom(
        this.chickeeDuckRepo.lockProc(
          loginID,
          process.env.CHICKEEDUCK_USER_ID,
          process.env.CHICKEEDUCK_USER_PASSWORD,
        ),
      );
      const procID = lockProcRes['Data'];
      this.logger.log(`Proc ID: ${procID}`);

      // Generate order for ChickeeDuck server from [data]
      const chickeeduckOrderJson = await this.orderShopifyToChickeeDuck(data);
      const chickeeduckOrderString = JSON.stringify(chickeeduckOrderJson);

      // Create order on ChickeeDuck server
      const target = 'SAL';
      const windowAction = 'update__window_data';
      const updateData = await lastValueFrom(
        this.chickeeDuckRepo.updateData(
          loginID,
          procID,
          windowAction,
          target,
          chickeeduckOrderString,
        ),
      );

      // If create order is unsuccessful
      if (
        updateData['Data'] === null &&
        updateData['Error'] !== null &&
        updateData['Error']['ErrCode'] === -1
      ) {
        this.logger.error(
          'Update ChickeeDuck database failed: ' +
            updateData['Error']['ErrMsg'],
        );
        if (updateData['Error']['ErrMsg'] === `SAL: Trx. no. exists:${trxNo}`) {
          // Transaction number exists, no need to place the order again
          webhookRecordDto.orderPlaced = 1;
          await this.shopifyWebhookRecordRepo.upsertOne(webhookRecordDto);
        }
      } else {
        // Update webhook record
        webhookRecordDto.orderPlaced = 1;
        await this.shopifyWebhookRecordRepo.upsertOne(webhookRecordDto);
      }

      // Unlock Product
      await lastValueFrom(this.chickeeDuckRepo.unlockProc(loginID, procID));

      return true;
    } catch (error) {
      throw error;
    } finally {
      // Logout from ChickeeDuck server
      if (!!loginID) {
        await lastValueFrom(
          this.chickeeDuckRepo.logoutChickeeDuckServer(loginID),
        );
        this.logger.log(`Logged out`);
      }
    }
  }

  // ---------- Private functions ----------

  /**
   * Transfer Shopify order data to ChickeeDuck order data
   * @param shopifyData Shopify data
   */
  private async orderShopifyToChickeeDuck(shopifyData: any) {
    /**
     * Get a payment code when entering information
     * @param company Credit card company
     * @returns Payment code for ChickeeDuck
     */
    function getCreditCardCode(company: string): string {
      let code = 'OT';
      switch (company) {
        case 'Visa':
          code = 'VI';
          break;
        case 'Mastercard':
          code = 'MC';
          break;
        case 'American Express':
          code = 'AE';
          break;
        case 'paypal':
          code = 'PL';
          break;
        case 'shopify_payments':
          code = 'SP';
          break;
        default:
          break;
      }
      return code;
    }

    const chickeeDuckData: any = {
      hdr: {
        trx_no: this.createTrxNo(shopifyData['order_number']),
        trx_type: 'SAL',
        doc_type: 'SA1',
        trx_date: moment(shopifyData['created_at'])
          .tz('Asia/Hong_Kong')
          .format('YYYY-MM-DD  HH:mm:ss'),
        user_member:
          !!shopifyData['customer'] && !!shopifyData['customer']['phone']
            ? shopifyData['customer']['phone'].substring(0, 15)
            : !!shopifyData['customer'] && !!shopifyData['customer']['email']
            ? shopifyData['customer']['email'].substring(0, 15)
            : !!shopifyData['customer']
            ? `${shopifyData['customer']['first_name']} ${shopifyData['customer']['last_name']}`
            : !!shopifyData['user_id']
            ? shopifyData['user_id']
            : 'Anonymous',
        curr_code: shopifyData['currency'],
        exch_rate: 1,
        trx_bas_amt: parseFloat(shopifyData['total_price']),
        trx_status: 'T',
        sh_code: this.shCode,
        wh_code_from: this.shCode,
        wh_code_to: '',
        salesman_code: this.salesmanCode,
        chg_rate: 1,
        cashier: this.cashier,
        cashi_no: this.cashierNo,
        sh_upd_by: this.shCode,
        ho_upd_by: this.shCode,
      },
      dat: await Promise.all(
        shopifyData['line_items'].map(async (item, idx) => {
          const itemVariant = await this.repo.findOne(item['variant_id']);
          const itemCode = !!itemVariant
            ? !!itemVariant.productBarcode &&
              itemVariant.productBarcode.length > 0
              ? itemVariant.productBarcode
              : itemVariant.productSKU
            : item['sku'];
          let trx_sub_disamt = 0;

          if (item['discount_allocations'].length > 0) {
            let tempDiscount = 0;
            item['discount_allocations'].forEach(
              (discount: any) => (tempDiscount += discount['amount']),
            );
            trx_sub_disamt =
              (item['price'] - tempDiscount) * item['quantity'] -
              item['total_discount'];
          } else {
            trx_sub_disamt =
              item['price'] * item['quantity'] - item['total_discount'];
          }

          const chickeeDuckItem = {
            trx_no: this.createTrxNo(shopifyData['order_number']),
            line_no: parseInt(idx) + 1, // Index starts with 1
            item_code: itemCode,
            item_name: item['name'].substring(0, 40),
            trx_type: 'S',
            unit_price: parseFloat(item['price']),
            item_qty: item['quantity'],
            item_discount:
              item['total_discount'] / (item['price'] * item['quantity']), // percentage off
            trx_sub_amt: item['price'] * item['quantity'],
            trx_sub_disamt: trx_sub_disamt,
            mem_a_dis: 0,
            dis_amt: 0,
            salesman_code: this.salesmanCode,
            sh_code: this.cashierNo,
          };

          return chickeeDuckItem;
        }),
      ),
      pay: [
        {
          trx_no: this.createTrxNo(shopifyData['order_number']),
          line_no: 1, //idx
          pay_code: !!shopifyData['payment_details']
            ? getCreditCardCode(
                shopifyData['payment_details']['credit_card_company'],
              )
            : getCreditCardCode(shopifyData['gateway']),
          pay_acc_amt: parseFloat(shopifyData['total_price']),
          pay_bas_amt: parseFloat(shopifyData['total_price']),
          curr_code: shopifyData['currency'],
          exch_rate: 1,
          is_cash: 'H',
        },
      ],
    };

    // Add handling charge
    const shipping_lines = shopifyData['shipping_lines'];
    chickeeDuckData.dat = chickeeDuckData.dat.concat(
      shipping_lines.map((shipment, idx) => {
        const len = chickeeDuckData.dat.length;
        const price = parseInt(shipment['price']);
        const discountedPrice = parseInt(shipment['discounted_price']);
        const chickeeDuckItem = {
          trx_no: this.createTrxNo(shopifyData['order_number']),
          line_no: len + 1 + idx, // Index starts with 1
          item_code: `MCHANDLE${discountedPrice}`,
          item_name: `Handling charge${discountedPrice}`,
          trx_type: 'S',
          unit_price: price,
          item_qty: 1,
          item_discount: 1 - discountedPrice / price, // percentage off
          trx_sub_amt: price,
          trx_sub_disamt: discountedPrice,
          mem_a_dis: 0,
          dis_amt: 0,
          salesman_code: this.salesmanCode,
          sh_code: this.cashierNo,
        };
        return chickeeDuckItem;
      }),
    );
    return chickeeDuckData;
  }

  /** Create transaction number for ChickeeDuck */
  private createTrxNo(orderNo: string | number) {
    let orderString: string =
      typeof orderNo === 'string' ? orderNo : orderNo.toFixed(0);
    const year = new Date().getFullYear().toString().substr(-2);
    const month = ('0' + (new Date().getMonth() + 1)).slice(-2);
    orderString = ('00' + orderString).slice(-6);
    const trxNo = this.orderNoPrefix + year + month + orderString;
    return trxNo;
  }
}
