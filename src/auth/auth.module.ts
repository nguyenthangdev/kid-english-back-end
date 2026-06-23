import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { LoginRateLimitGuard } from './guards/login-rate-limit.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role]), JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, AdminAuthGuard, LoginRateLimitGuard],
  exports: [AuthService, AdminAuthGuard, JwtModule],
})
export class AuthModule {}
