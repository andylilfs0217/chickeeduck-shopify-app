import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { catchError, map } from 'rxjs';
import { PathUtils } from 'src/utils/path.utils';
import { ChickeeDuckRequestRecordsService } from './chickeeduck-request-records.service';

@Injectable()
export class ChickeeDuckService {
  constructor(
    private httpService: HttpService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private reqRecordsService: ChickeeDuckRequestRecordsService,
  ) {}

  /**
   * Update data in ChickeeDuck server
   */
  public updateData(
    loginID: string,
    procID: string,
    windowAction: string,
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
          { Name: 'window__action', Value: windowAction },
          { Name: 'window__action_target', Value: target },
          { Name: 'data', Value: data },
        ],
        numberParms: null,
        datetimeParms: null,
      };
      const requestBody = `"${JSON.stringify(body)
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')}"`;
      this.logger.log(
        'Placing order to ChickeeDuck server and executing function ',
      );
      this.logger.log(requestBody);

      const headers = { 'Content-Type': 'application/json' };
      return this.httpService
        .post(apiUrl, requestBody, { headers: headers })
        .pipe(
          map((res) => {
            if (res.data['Data'] !== null || res.data['Error'] === null)
              this.reqRecordsService.saveRequestBody(body, data);
            return res.data;
          }),
          catchError((e) => {
            this.logger.error('ExecuteFunction error');
            this.logger.error(e.message);
            throw e;
          }),
        );
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
  public lockProc(loginID: string, username: string, password: string) {
    try {
      const apiUrl = PathUtils.getChickeeDuckServerAPI('LockProcess');
      const body = `"${JSON.stringify({
        loginID: loginID,
        userID: username,
        userPWD: password,
        isBatch: 'Y',
      })
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')}"`;
      const headers = { 'Content-Type': 'application/json' };
      return this.httpService.post(apiUrl, body, { headers: headers }).pipe(
        map((res) => res.data),
        catchError((e) => {
          this.logger.error('LockProcess error');
          this.logger.error(e.message);
          throw e;
        }),
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Unlock the product in ChickeeDuck server
   */
  public unlockProc(loginID: string, procID: string) {
    try {
      const apiUrl = PathUtils.getChickeeDuckServerAPI('UnlockProcess');
      const body = `"${JSON.stringify({
        loginID: loginID,
        parmData: procID,
      })
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')}"`;
      const headers = { 'Content-Type': 'application/json' };
      return this.httpService.post(apiUrl, body, { headers: headers }).pipe(
        map((res) => res.data),
        catchError((e) => {
          this.logger.error('UnlockProcess error');
          this.logger.error(e.message);
          throw e;
        }),
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Log in ChickeeDuck server
   * @returns ChickeeDuck Login ID
   */
  public loginChickeeDuckServer(username: string, password: string) {
    try {
      const chickeeDuckApi = PathUtils.getChickeeDuckServerAPI('Login');
      const body = `"${JSON.stringify({
        UserName: username,
        Password: password,
        ProcessType: 1,
      })
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')}"`;
      const headers = { 'Content-Type': 'application/json' };
      return this.httpService
        .post(chickeeDuckApi, body, { headers: headers })
        .pipe(
          map((res) => res.data),
          catchError((e) => {
            this.logger.error('Login error');
            this.logger.error(e.message);
            throw e;
          }),
        );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout ChickeeDuck server
   * @param loginID Login ID
   * @returns true
   */
  public logoutChickeeDuckServer(loginID: string) {
    try {
      const chickeeDuckApi = PathUtils.getChickeeDuckServerAPI('logout');
      const body = `"${loginID}"`;
      const headers = { 'Content-Type': 'application/json;charset=utf-8' };
      return this.httpService
        .post(chickeeDuckApi, body, { headers: headers })
        .pipe(
          map((res) => res.data),
          catchError((e) => {
            this.logger.error('Logout error');
            this.logger.error(e.message);
            throw e;
          }),
        );
    } catch (error) {
      // throw error;
    }
  }
}
