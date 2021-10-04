import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { map } from 'rxjs';
import { PathUtils } from 'src/utils/path.utils';

@Injectable()
export class ShopifyWebhookService {
  constructor(private httpService: HttpService) {}

  /**
   * Update ChickeeDuck inventory in ChickeeDuck server
   * @param data Webhook body from Shopify
   * @returns true
   */
  async updateChickeeDuckInventory(data: any) {
    try {
      // Login to ChickeeDuck server
      const loginRes = this.loginChickeeDuckServer(
        process.env.CHICKEEDUCK_LOGIN_USERNAME,
        process.env.CHICKEEDUCK_LOGIN_PASSWORD,
      );
      let loginID: string;
      if (loginRes['Data'] === true)
        loginID = loginRes['WarningMsg'][0] as string;

      // Lock Product
      const lockProcRes = this.lockProc(
        loginID,
        process.env.CHICKEEDUCK_LOGIN_USERNAME,
        process.env.CHICKEEDUCK_LOGIN_PASSWORD,
      );
      const procID = lockProcRes['Data'];

      // Generate order for ChickeeDuck server from [data]
      const chickeeduckOrder = this.orderShopifyToChickeeDuck(data);

      // Create order on ChickeeDuck server
      const target = 'SAL';
      this.updateData(loginID, procID, target, chickeeduckOrder);

      // Unlock Product
      this.unlockProc(loginID, procID);

      // Logout from ChickeeDuck server
      this.logoutChickeeDuckServer(loginID);
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
        default:
          break;
      }
      return code;
    }

    // Information constants
    const salesmanCode = 'D155';
    const shCode = 'SW004';
    const cashier = 'BOSS';
    const cashierNo = 'SW00403';

    const chickeeDuckData = {
      hdr: {
        trx_no: shopifyData['order_no'],
        trx_type: 'SAL',
        doc_type: 'SA1',
        trx_date: shopifyData['created_at'],
        user_member: shopifyData['customer']['email'],
        curr_code: shopifyData['currency'],
        exch_rate: 1,
        trx_bas_amt: shopifyData['total_price'],
        trx_status: 'T',
        sh_code: shCode,
        wh_code_from: shCode,
        wh_code_to: '',
        salesman_code: salesmanCode,
        chg_rate: 1,
        cashier: cashier,
        cashi_no: cashierNo,
      },
      dat: [],
      pay: [
        {
          trx_no: shopifyData['order_no'],
          line_no: 1, //idx
          pay_code: !!shopifyData['payment_details']
            ? getCreditCardCode(
                shopifyData['payment_details']['credit_card_company'],
              )
            : null,
          pay_acc_amt: shopifyData['total_price'],
          pay_bas_amt: shopifyData['total_price'],
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
          trx_no: shopifyData['order_no'],
          line_no: idx + 1, // Index starts with 1
          item_code: item['sku'],
          item_name: item['name'],
          trx_type: 'S',
          unit_price: item['price'],
          item_qty: item['quantity'],
          item_discount:
            item['total_discount'] / (item['price'] * item['quantity']), // percentage off
          trx_sub_amt: item['price'] * item['quantity'],
          trx_sub_disamt:
            item['price'] * item['quantity'] - item['total_discount'],
          mem_a_dis: 0,
          dis_amt: 0,
          salesman_code: salesmanCode,
          sh_code: cashierNo,
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
        pmtID: 1,
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
}
