import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class ShopifyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const rawBody = request.rawBody;
    // Testing
    const isTest = request.headers['x-shopify-test'] === 'true';
    // Get Hmac header
    const hash = request.headers['x-shopify-hmac-sha256'];
    if (!hash) throw new UnauthorizedException();
    // Validation
    const secret = isTest
      ? process.env.TEST_SHARED_SECRET
      : process.env.SHARED_SECRET;
    const computedHash = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('base64');
    const isValid = hash === computedHash;
    if (!isValid) throw new UnauthorizedException();

    return next.handle();
  }
}
