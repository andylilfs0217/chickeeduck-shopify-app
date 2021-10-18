import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom, map } from 'rxjs';
import { PathUtils } from 'src/utils/path.utils';
import * as moment from 'moment';

@Injectable()
export class ShopifyWebhookService {
  constructor(private httpService: HttpService) {}

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
    try {
      // Login to ChickeeDuck server
      const loginRes = await lastValueFrom(
        this.loginChickeeDuckServer(
          process.env.CHICKEEDUCK_LOGIN_USERNAME,
          process.env.CHICKEEDUCK_LOGIN_PASSWORD,
        ),
      );
      let loginID: string;
      if (loginRes['Data'] === true)
        loginID = loginRes['WarningMsg'][0] as string;

      // Lock Product
      const lockProcRes = await lastValueFrom(
        this.lockProc(
          loginID,
          process.env.CHICKEEDUCK_USER_ID,
          process.env.CHICKEEDUCK_USER_PASSWORD,
        ),
      );
      const procID = lockProcRes['Data'];

      // Generate order for ChickeeDuck server from [data]
      const chickeeduckOrderJson = this.orderShopifyToChickeeDuck(data);
      const chickeeduckOrderString = JSON.stringify(chickeeduckOrderJson);

      // Create order on ChickeeDuck server
      const target = 'SAL';
      // const updateData = await lastValueFrom(
      this.updateData(loginID, procID, target, chickeeduckOrderString);
      // );

      // Unlock Product
      // const unlock = await lastValueFrom(
      this.unlockProc(loginID, procID);
      // );

      // Logout from ChickeeDuck server
      // const logout = await lastValueFrom(
      this.logoutChickeeDuckServer(loginID);
      // );
      return true;
    } catch (error) {
      throw error;
    }
  }

  // ---------- Private functions ----------

  /**
   * Transfer Shopify order data to ChickeeDuck order data
   * @param shopifyData Shopify data
   */
  private orderShopifyToChickeeDuck(shopifyData: any) {
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
        case 'MasterCard':
          code = 'MC';
          break;
        case 'paypal':
          code = 'PL';
          break;
        default:
          break;
      }
      return code;
    }

    const chickeeDuckData = {
      hdr: {
        trx_no: this.createTrxNo(shopifyData['order_number']),
        trx_type: 'SAL',
        doc_type: 'SA1',
        trx_date: moment(shopifyData['created_at']).format(
          'YYYY-MM-DD  HH:mm:ss',
        ),
        user_member: shopifyData['customer']['email'],
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
      },
      dat: [],
      pay: [
        {
          trx_no: this.createTrxNo(shopifyData['order_number']),
          line_no: 1, //idx
          // shopifyData['payment_gateway_names'][0] = 'paypal'
          // shopifyData['gateway'] = 'paypal'
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
    for (const idx in shopifyData['line_items']) {
      if (
        Object.prototype.hasOwnProperty.call(shopifyData['line_items'], idx)
      ) {
        const item = shopifyData['line_items'][idx];

        const chickeeDuckItem = {
          trx_no: this.createTrxNo(shopifyData['order_number']),
          line_no: parseInt(idx) + 1, // Index starts with 1
          item_code: item['sku'],
          item_name: item['name'],
          trx_type: 'S',
          unit_price: parseFloat(item['price']),
          item_qty: item['quantity'],
          item_discount:
            item['total_discount'] / (item['price'] * item['quantity']), // percentage off
          trx_sub_amt: item['price'] * item['quantity'],
          trx_sub_disamt:
            item['price'] * item['quantity'] - item['total_discount'],
          mem_a_dis: 0,
          dis_amt: 0,
          salesman_code: this.salesmanCode,
          sh_code: this.cashierNo,
        };

        chickeeDuckData.dat.push(chickeeDuckItem);
      }
    }
    return chickeeDuckData;
  }

  /**
   * Update data in ChickeeDuck server
   */
  private updateData(
    loginID: string,
    procID: string,
    target: string,
    data: any,
  ) {
    try {
      const apiUrl = PathUtils.getChickeeDuckServerAPI('ExecuteFunction');
      const body = {
        loginID: loginID,
        procID: procID,
        funcNo: 'import_data',
        funcType: 1,
        funcTableType: 4,
        pmtID: -1,
        stringParms: [
          { Name: 'window__action', Value: 'update__window_data' },
          { Name: 'window__action_target', Value: target },
          { Name: 'data', Value: data },
        ],
        numberParms: null,
        datetimeParms: null,
      };
      return this.httpService
        .post(apiUrl, JSON.stringify(body))
        .pipe(map((res) => res.data));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lock the process in ChickeeDuck server
   * @param loginID ChickeeDuck login ID
   * @param username ChickeeDuck username
   * @param password ChickeeDuck password
   */
  private lockProc(loginID: string, username: string, password: string) {
    try {
      const apiUrl = PathUtils.getChickeeDuckServerAPI('LockProcess');
      const body = {
        loginID: loginID,
        userID: username,
        userPWD: password,
        isBatch: 'Y',
      };
      return this.httpService.post(apiUrl, body).pipe(map((res) => res.data));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Unlock the product in ChickeeDuck server
   */
  private unlockProc(loginID: string, procID: string) {
    try {
      const apiUrl = PathUtils.getChickeeDuckServerAPI('UnlockProcess');
      const body = {
        loginID: loginID,
        parmData: procID,
      };
      return this.httpService.post(apiUrl, body).pipe(map((res) => res.data));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Log in ChickeeDuck server
   * @returns ChickeeDuck Login ID
   */
  private loginChickeeDuckServer(username: string, password: string) {
    try {
      const chickeeDuckApi = PathUtils.getChickeeDuckServerAPI('login');
      const body = {
        UserName: username,
        Password: password,
        ProcessType: 1,
      };
      return this.httpService
        .post(chickeeDuckApi, body)
        .pipe(map((res) => res.data));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout ChickeeDuck server
   * @param loginID Login ID
   * @returns true
   */
  private logoutChickeeDuckServer(loginID: string) {
    try {
      const chickeeDuckApi = PathUtils.getChickeeDuckServerAPI('logout');
      const body = loginID;
      return this.httpService
        .post(chickeeDuckApi, body)
        .pipe(map((res) => res.data));
    } catch (error) {
      throw error;
    }
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
