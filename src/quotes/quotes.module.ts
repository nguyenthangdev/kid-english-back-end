import { Module } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { AdminQuoteController } from './admin-quote/admin-quote.controller';

@Module({
  controllers: [QuotesController, AdminQuoteController],
  providers: [QuotesService],
})
export class QuotesModule {}
