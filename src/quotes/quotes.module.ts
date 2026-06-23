import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Quote } from './entities/quote.entity';
import { DailyQuote } from './entities/daily-quote.entity';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { AdminQuoteController } from './admin-quote/admin-quote.controller';
import { DailyQuoteService } from './daily-quote.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([Quote, DailyQuote]),
    ScheduleModule.forRoot(),
  ],
  controllers: [QuotesController, AdminQuoteController],
  providers: [QuotesService, DailyQuoteService],
  exports: [QuotesService, DailyQuoteService],
})
export class QuotesModule {}
