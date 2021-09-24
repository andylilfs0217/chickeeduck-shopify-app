import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ShopifyController } from './shopify/shopify.controller';
import { ShopifyService } from './shopify/shopify.service';
import { ShopifyWebhookController } from './shopify/shopify-webhook/shopify-webhook.controller';
import { ShopifyWebhookService } from './shopify/shopify-webhook/shopify-webhook.service';

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
export class AppModule {}
