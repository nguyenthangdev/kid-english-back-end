import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { LoggingMiddleware } from './middleware/logging/logging.middleware';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const clientUrl = configService.get<string>('CLIENT_URL');
  const port = configService.get<number>('PORT') || 3000;

  app.enableCors({
    origin: [clientUrl],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
  });

  app.use(cookieParser());
  // app.use(new LoggingMiddleware().use);
  // Định nghĩa cấu hình cho tài liệu Swagger (Cây thư mục, Tên dự án, Phiên bản)

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // BẬT cho phép class-transformer hoạt động
      whitelist: true, // Tự động vứt bỏ các trường dữ liệu rác mà Frontend cố tình nhét thêm vào
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('Dự án NestJS đầu tiên của tôi')
    .setDescription('Tài liệu hướng dẫn sử dụng API chi tiết cho Frontend')
    .setVersion('1.0')
    .addBearerAuth() // Thêm dòng này nếu sau này bạn làm tính năng Đăng nhập bằng JWT Token
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Ứng dụng đang chạy tại: http://localhost:3000`);
  console.log(`Xem tài liệu API tại: http://localhost:3000/api`);
}
bootstrap();
