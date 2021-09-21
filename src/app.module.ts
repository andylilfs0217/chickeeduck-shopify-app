import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ShopifyController } from './shopify/shopify.controller';
import { ShopifyService } from './shopify/shopify.service';

@Module({
  imports: [
    // Configure dotenv
    ConfigModule.forRoot({
      envFilePath: ['.env.development', '.env.staging', '.env.production'],
    }),
    // Http
    HttpModule.registerAsync({
      useFactory: () => ({ timeout: 5000, maxRedirects: 5 }),
    }),
  ],
  controllers: [AppController, ShopifyController],
  providers: [AppService, ShopifyService],
})
export class AppModule {}
