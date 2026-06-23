import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeService } from './home.service';
import { HomeController } from './home.controller';
import { UsersModule } from '../users/users.module';
import { QuotesModule } from '../quotes/quotes.module';
import { UserStreak } from '../users/entities/user-streak.entity';
import { UserStatistics } from '../users/entities/user-statistics.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserStreak, UserStatistics]),
    UsersModule, // provides ProgressService
    QuotesModule, // provides DailyQuoteService
  ],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
