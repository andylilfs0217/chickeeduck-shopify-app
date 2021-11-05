// raw-body-parser.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class RawBodyParserMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => any) {
    req['rawBody'] = req.body;
    req.body = JSON.parse(req.body.toString());
    next();
  }
}
