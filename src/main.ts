import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { config } from 'process';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Security headers ──────────────────────────────────────────────────────
  app.use(helmet());

  // ── Global Validation Pipe ────────────────────────────────────────────────
  const configService = app.get(ConfigService);
  const clientUrl = configService.get<string>('CLIENT_URL');

  app.enableCors({
    origin: [clientUrl],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // // ── Global Exception Filter ───────────────────────────────────────────────
  // app.useGlobalFilters(new GlobalHttpExceptionFilter());

  // // ── Global Transform Interceptor ──────────────────────────────────────────
  // app.useGlobalInterceptors(new TransformInterceptor());

  // ── Swagger (dev only) ────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('KidEnglish API')
      .setDescription('Backend API for the KidEnglish application')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    const port = configService.get<number>('PORT');
    console.log(`📖 Swagger UI: http://localhost:${port}/docs`);
  }

  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port);
  console.log(`🚀 Application running on: http://localhost:${port}/api`);
}

void bootstrap();
