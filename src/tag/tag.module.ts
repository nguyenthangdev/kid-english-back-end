import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { UserTagController } from './user-tag.controller';
import { Tag } from './entities/tag.entity';
import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [TypeOrmModule.forFeature([Tag]), AuthModule],
  controllers: [TagController, UserTagController],
  providers: [TagService],
  exports: [TagService],
})
export class TagModule {}
