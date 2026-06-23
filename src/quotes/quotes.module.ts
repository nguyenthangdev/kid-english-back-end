import { Module } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { AdminQuoteController } from './admin-quote/admin-quote.controller';
import { Quote } from './entities/quote.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Quote])],
  controllers: [QuotesController, AdminQuoteController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
