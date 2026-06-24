import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { LoginRateLimitGuard } from '../common/guards/login-rate-limit.guard';
import { JwtModule } from '@nestjs/jwt';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    JwtModule.register({}),
    StorageModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AdminAuthGuard, LoginRateLimitGuard],
  exports: [AuthService, AdminAuthGuard, JwtModule],
})
export class AuthModule {}
