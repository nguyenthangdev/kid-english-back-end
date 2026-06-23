import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserStreak } from './entities/user-streak.entity';
import { UserActivity } from './entities/user-activity.entity';
import { UserVocabularyProgress } from './entities/user-vocabulary-progress.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserStreak,
      UserActivity,
      UserVocabularyProgress,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
