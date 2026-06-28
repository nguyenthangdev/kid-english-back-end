import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtUserAuthGuard } from '../common/guards/jwt-user-auth.guard';
import { QuotesService } from './quotes.service';
import { DailyQuoteService } from './daily-quote.service';
import { QuoteQueryDto } from './dto/quote-query.dto';

@ApiTags('Quotes')
@ApiBearerAuth('access-token')
@UseGuards(JwtUserAuthGuard)
@Controller('quotes')
export class QuotesController {
  constructor(
    private readonly quotesService: QuotesService,
    private readonly dailyQuoteService: DailyQuoteService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List quotes with cursor-based pagination' })
  listQuotes(@Query() query: QuoteQueryDto) {
    return this.quotesService.listQuotes(query);
  }

  @Get('today')
  @ApiOperation({ summary: 'Get quote of the day' })
  getToday() {
    return this.dailyQuoteService.getTodayQuote();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single quote by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.quotesService.findById(id);
  }
}
