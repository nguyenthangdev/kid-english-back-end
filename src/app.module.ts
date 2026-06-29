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
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';
import { envValidationSchema } from './config/env.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { StorageModule } from './storage/storage.module';
import KeyvRedis from '@keyv/redis';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsModule } from './permissions/permissions.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [
    // ── Config (global, with Joi validation) ───────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      load: [databaseConfig, jwtConfig],
    }),

    // ── Rate Limiting ──────────────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('THROTTLE_TTL', 600000),
          limit: configService.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // ── Global Cache (Redis) ──────────────────────────────────────────────
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        stores: [
          new KeyvRedis(
            configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
          ),
        ],
        ttl: 3600000, // 1 hour default TTL in ms
      }),
    }),

    // ── Database ───────────────────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('POSTGRES_URI'),
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

    // ── Feature Modules ────────────────────────────────────────────────────
    StorageModule,
    AuthModule,
    UsersModule,
    RolesModule,
    TagModule,
    VocabularyModule,
    QuotesModule,
    HomeModule,
    PermissionsModule,
    ProfileModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global rate-limit guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
