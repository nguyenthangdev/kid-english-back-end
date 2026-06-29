import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role]), StorageModule, AuthModule],
  controllers: [ProfileController],
  providers: [ProfileService, AdminAuthGuard],
  exports: [ProfileService],
})
export class ProfileModule {}
