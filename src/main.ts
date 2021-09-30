import { NestFactory } from '@nestjs/core';
import Shopify, { ApiVersion } from '@shopify/shopify-api';
import { AppModule } from './app.module';

async function bootstrap() {
  const { API_KEY, PASSWORD, HOSTNAME, SCOPES } = process.env;
  Shopify.Context.initialize({
    API_KEY,
    API_SECRET_KEY: PASSWORD,
    SCOPES: [SCOPES],
    HOST_NAME: HOSTNAME,
    IS_EMBEDDED_APP: false,
    IS_PRIVATE_APP: true,
    API_VERSION: ApiVersion.July21,
  });
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
