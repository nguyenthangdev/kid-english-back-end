import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Quote } from './entities/quote.entity';
import { DailyQuote } from './entities/daily-quote.entity';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { AdminQuoteController } from './admin-quote/admin-quote.controller';
import { DailyQuoteService } from './daily-quote.service';
import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Quote, DailyQuote]),
    ScheduleModule.forRoot(),
    AuthModule,
  ],
  controllers: [QuotesController, AdminQuoteController],
  providers: [QuotesService, DailyQuoteService],
  exports: [QuotesService, DailyQuoteService],
})
export class QuotesModule {}
