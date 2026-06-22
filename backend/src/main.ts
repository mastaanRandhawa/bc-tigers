import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { getCorsOrigins } from './common/cors-origins';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Behind a single reverse proxy (Render) — trust exactly one hop so req.ip is
  // the real client and X-Forwarded-For can't be spoofed past the proxy.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(compression());
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Bearer-token auth (no cookies) — credentialed CORS is unnecessary.
  app.enableCors({
    origin: getCorsOrigins(),
    credentials: false,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`BC Tigers API running on http://localhost:${port}/api`);
  console.log(`WebSocket gateway active`);
}

void bootstrap();
