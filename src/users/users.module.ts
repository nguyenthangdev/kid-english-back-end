import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UserStreak } from './entities/user-streak.entity';
import { UserActivity } from './entities/user-activity.entity';
import { UserVocabularyProgress } from './entities/user-vocabulary-progress.entity';
import { UserStatistics } from './entities/user-statistics.entity';
import { ProgressService } from './progress.service';
import { GamificationService } from './gamification.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserStreak,
      UserActivity,
      UserVocabularyProgress,
      UserStatistics,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, ProgressService, GamificationService],
  exports: [UsersService, ProgressService, GamificationService, TypeOrmModule],
})
export class UsersModule {}
