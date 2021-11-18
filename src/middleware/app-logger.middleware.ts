import { Request, Response, NextFunction } from 'express';
import {
  Injectable,
  NestMiddleware,
  Inject,
  LoggerService,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class AppLoggerMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = request;
    const userAgent = request.get('user-agent') || '';

    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length');

      const msg = `${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent} ${ip}`;
      this.logger.log(msg);
    });

    next();
  }
}
