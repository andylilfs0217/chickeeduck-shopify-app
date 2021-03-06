import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ShopifyController } from './shopify/shopify.controller';
import { ShopifyService } from './shopify/shopify.service';
import { ShopifyWebhookController } from './shopify/shopify-webhook/shopify-webhook.controller';
import { ShopifyWebhookService } from './shopify/shopify-webhook/shopify-webhook.service';
import { RawBodyMiddleware } from './middleware/raw-body.middleware';
import { RawBodyParserMiddleware } from './middleware/raw-body-parser.middleware';
import { JsonBodyMiddleware } from './middleware/json-body.middleware';
import { AppLoggerMiddleware } from './middleware/app-logger.middleware';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as winston from 'winston';
import { SchedulerController } from './scheduler/scheduler.controller';
import { SchedulerService } from './scheduler/scheduler.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TShopifyProductVariants } from './entities/shopify/products.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { ChickeeDuckService } from './chickeeduck/chickeeduck.service';
import { TWebhookRecords } from './entities/shopify/webhook-records.entity';
import { ShopifyWebhookRecordService } from './shopify/shopify-webhook/shopify-webhook-record.service';
import { ShopifyWebhookRecordController } from './shopify/shopify-webhook/shopify-webhook-record.controller';
import { TRequestBodyRecords } from './entities/chickeeduck/request-body-records.entity';
import { ChickeeDuckRequestRecordsController } from './chickeeduck/chickeeduck-request-records.controller';
import { ChickeeDuckRequestRecordsService } from './chickeeduck/chickeeduck-request-records.service';
import { TRequestBodyData } from './entities/chickeeduck/request-body-data.entity';
import { TRequestBodyHeaders } from './entities/chickeeduck/request-body-headers.entity';
import { TRequestBodyPayments } from './entities/chickeeduck/request-body-payments.entity';

function loggerFilterOnly(level: string) {
  return winston.format(function (info) {
    if (info['level'] === level) return info;
  })();
}

@Module({
  imports: [
    // Configure dotenv
    ConfigModule.forRoot({
      envFilePath: ['.development.env', '.staging.env', '.production.env'],
    }),
    // Http
    HttpModule.registerAsync({
      useFactory: () => ({ timeout: 10000, maxRedirects: 10 }),
    }),
    // Winston logger
    WinstonModule.forRoot({
      transports: [
        ...['error', 'warn', 'info', 'debug'].map(
          (level) =>
            new winston.transports.File({
              filename: `logs/${level}.log`,
              level: level,
              format: winston.format.combine(
                loggerFilterOnly(level),
                winston.format.timestamp(),
                winston.format.ms(),
                winston.format.json(),
              ),
            }),
        ),
        new winston.transports.Console({
          level: 'info',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike(process.env.APP_NAME, {
              prettyPrint: true,
            }),
          ),
        }),
      ],
    }),
    // TypeORM
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.TYPEORM_HOST,
      username: process.env.TYPEORM_USERNAME,
      password: process.env.TYPEORM_PASSWORD,
      database: process.env.TYPEORM_DATABASE,
      synchronize: process.env.TYPEORM_SYNCHRONIZE == 'true',
      port: process.env.TYPEORM_PORT
        ? parseInt(process.env.TYPEORM_PORT)
        : null,
      charset: 'utf8mb4_unicode_ci',
      entities: ['src/**/**.entity.ts'],
      keepConnectionAlive: true,
      // bigNumberStrings: false,
      timezone: 'Z',
    }),
    // Scheduler
    ScheduleModule.forRoot(),
    // TypeORM tables
    TypeOrmModule.forFeature([
      TShopifyProductVariants,
      TWebhookRecords,
      TRequestBodyRecords,
      TRequestBodyData,
      TRequestBodyHeaders,
      TRequestBodyPayments,
    ]),
  ],
  controllers: [
    AppController,
    ShopifyController,
    ShopifyWebhookController,
    SchedulerController,
    ShopifyWebhookRecordController,
    ChickeeDuckRequestRecordsController,
  ],
  providers: [
    AppService,
    ShopifyService,
    ShopifyWebhookService,
    SchedulerService,
    ChickeeDuckService,
    ShopifyWebhookRecordService,
    ChickeeDuckRequestRecordsService,
  ],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RawBodyMiddleware, RawBodyParserMiddleware, AppLoggerMiddleware)
      .forRoutes(ShopifyWebhookController)
      .apply(JsonBodyMiddleware, AppLoggerMiddleware)
      .forRoutes('*');
  }
}
