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

@Module({
  imports: [
    // Configure dotenv
    ConfigModule.forRoot({
      envFilePath: [
        // '.thinkshops.development.env',
        '.development.env',
        '.staging.env',
        '.production.env',
      ],
    }),
    // Http
    HttpModule.registerAsync({
      useFactory: () => ({ timeout: 5000, maxRedirects: 5 }),
    }),
  ],
  controllers: [AppController, ShopifyController, ShopifyWebhookController],
  providers: [AppService, ShopifyService, ShopifyWebhookService],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RawBodyMiddleware, RawBodyParserMiddleware)
      .forRoutes(ShopifyWebhookController)
      .apply(JsonBodyMiddleware)
      .forRoutes('*');
  }
}
