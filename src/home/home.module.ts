import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { HomeController } from './home.controller';
import { AdminHomeController } from './admin-home.controller';

// Services
import { HomeService } from './home.service';
import { AdminHomeService } from './admin-home.service';

// External modules
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { QuotesModule } from '../quotes/quotes.module';

// Entities required by HomeService
import { UserStreak } from '../users/entities/user-streak.entity';
import { UserStatistics } from '../users/entities/user-statistics.entity';

// Additional entities required by AdminHomeService
import { User } from '../users/entities/user.entity';
import { Vocabulary } from '../vocabulary/entities/vocabulary.entity';
import { Quote } from '../quotes/entities/quote.entity';
import { Tag } from '../tag/entities/tag.entity';
import { UserVocabularyProgress } from '../users/entities/user-vocabulary-progress.entity';
import { UserActivity } from '../users/entities/user-activity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // HomeService repos
      UserStreak,
      UserStatistics,
      // AdminHomeService repos
      User,
      Vocabulary,
      Quote,
      Tag,
      UserVocabularyProgress,
      UserActivity,
    ]),
    AuthModule, // provides AdminAuthGuard, JwtAuthGuard, JwtStrategy
    UsersModule, // provides ProgressService
    QuotesModule, // provides DailyQuoteService
  ],
  controllers: [HomeController, AdminHomeController],
  providers: [HomeService, AdminHomeService],
  // Export AdminHomeService so other modules can call invalidateCache()
  exports: [AdminHomeService],
})
export class HomeModule {}
