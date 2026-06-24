import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';

// ── Admin auth ──────────────────────────────────────────────────────────────
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { LoginRateLimitGuard } from '../common/guards/login-rate-limit.guard';
import { JwtModule } from '@nestjs/jwt';

// ── User auth ───────────────────────────────────────────────────────────────
import { UserAuthController } from './user-auth.controller';
import { UserAuthService } from './user-auth.service';
import { JwtUserStrategy } from '../common/strategies/jwt-user.strategy';
import { JwtUserAuthGuard } from '../common/guards/jwt-user-auth.guard';

// ── Shared ──────────────────────────────────────────────────────────────────
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtStrategy } from '../common/strategies/jwt.strategy';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    StorageModule,
  ],
  controllers: [AuthController, UserAuthController],
  providers: [
    // Admin
    AuthService,
    AdminAuthGuard,
    JwtStrategy,
    // User
    UserAuthService,
    JwtUserStrategy,
    JwtUserAuthGuard,
    // Shared
    JwtAuthGuard,
    LoginRateLimitGuard,
  ],
  exports: [
    AuthService,
    AdminAuthGuard,
    JwtAuthGuard,
    // Export user guard so HomeModule (and others) can use @UseGuards(JwtUserAuthGuard)
    JwtUserAuthGuard,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
