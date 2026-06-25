import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Get,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { QuotesService } from '../quotes.service';
import { CreateQuoteDto } from '../dto/create-quote.dto';
import { UpdateQuoteDto } from '../dto/update-quote.dto';
import { QuoteQueryDto } from '../dto/quote-query.dto';

@ApiTags('Admin — Quotes')
@ApiBearerAuth('access-token')
@Controller('admin/quotes')
export class AdminQuoteController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get list of vocabularies (Cursor Pagination)' })
  findAll(@Query() query: QuoteQueryDto) {
    return this.quotesService.listQuotes(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new quote (Admin only)' })
  create(@Body() dto: CreateQuoteDto) {
    return this.quotesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a quote (Admin only)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateQuoteDto) {
    return this.quotesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a quote (Admin only)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.quotesService.softDelete(id);
  }
}
