import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ApiVersion, Shopify } from '@shopify/shopify-api';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(), {
    cors: true,
    bodyParser: false,
  });
  const port: number = parseInt(process.env.PORT) || 3000;
  console.log(`Starting app at port ${port}`);
  await app.listen(port);
}

const API_KEY = process.env.API_KEY;
const PASSWORD = process.env.PASSWORD;
const HOSTNAME = process.env.HOSTNAME;
const SCOPES = process.env.SCOPES.split(',');
Shopify.Context.initialize({
  API_KEY: API_KEY,
  API_SECRET_KEY: PASSWORD,
  SCOPES: SCOPES,
  HOST_NAME: HOSTNAME,
  IS_EMBEDDED_APP: true,
  IS_PRIVATE_APP: true,
  API_VERSION: ApiVersion.July21,
});

bootstrap();
