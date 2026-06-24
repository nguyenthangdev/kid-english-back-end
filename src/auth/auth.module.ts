import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';

// ── Admin auth ──────────────────────────────────────────────────────────────
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminAuthGuard } from './guards/admin-auth.guard';

// ── User auth ───────────────────────────────────────────────────────────────
import { UserAuthController } from './user-auth.controller';
import { UserAuthService } from './user-auth.service';
import { JwtUserStrategy } from './strategies/jwt-user.strategy';
import { JwtUserAuthGuard } from './guards/jwt-user-auth.guard';

// ── Shared ──────────────────────────────────────────────────────────────────
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginRateLimitGuard } from './guards/login-rate-limit.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
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
