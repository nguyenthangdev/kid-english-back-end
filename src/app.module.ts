import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { QuotesModule } from './quotes/quotes.module';
import { VocabularyModule } from './vocabulary/vocabulary.module';
import { HomeModule } from './home/home.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesModule } from './roles/roles.module';
import { TagModule } from './tag/tag.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
@Module({
  imports: [
    // 1. Đăng ký ConfigModule đầu tiên
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Dùng forRootAsync thay vì forRoot
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('POSTGRES_URI'), // Lấy link qua ConfigService
        autoLoadEntities: true,
        synchronize: false,
        ssl: true,
        extra: {
          ssl: {
            rejectUnauthorized: false,
          },
        },
      }),
    }),

    UsersModule,
    AuthModule,
    HomeModule,
    VocabularyModule,
    QuotesModule,
    RolesModule,
    TagModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
