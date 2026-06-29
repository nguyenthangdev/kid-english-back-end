import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';

// Admin auth
import { AuthController } from './admin-auth/admin-auth.controller';
import { AuthService } from './admin-auth/admin-auth.service';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { LoginRateLimitGuard } from '../common/guards/rate-limit-login.guard';
import { JwtModule } from '@nestjs/jwt';

// User auth
import { UserAuthController } from './user-auth.controller';
import { UserAuthService } from './user-auth.service';
import { JwtUserStrategy } from '../common/strategies/jwt-user.strategy';
import { JwtUserAuthGuard } from '../common/guards/jwt-user-auth.guard';

// Shared
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtStrategy } from '../common/strategies/jwt.strategy';

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
