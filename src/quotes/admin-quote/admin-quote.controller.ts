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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionModule, PermissionAction } from '../../common/constants/enums';
import { QuotesService } from '../quotes.service';
import { CreateQuoteDto } from '../dto/create-quote.dto';
import { UpdateQuoteDto } from '../dto/update-quote.dto';
import { QuoteQueryDto } from '../dto/quote-query.dto';

@ApiTags('Admin — Quotes')
@ApiBearerAuth('access-token')
@UseGuards(AdminAuthGuard, RolesGuard)
@Controller('admin/quotes')
export class AdminQuoteController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Permissions({ module: PermissionModule.QUOTE, action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get list of vocabularies (Cursor Pagination)' })
  findAll(@Query() query: QuoteQueryDto) {
    return this.quotesService.listQuotes(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions({ module: PermissionModule.QUOTE, action: PermissionAction.CREATE })
  @ApiOperation({ summary: 'Create a new quote (Admin only)' })
  create(@Body() dto: CreateQuoteDto) {
    return this.quotesService.create(dto);
  }

  @Patch(':id')
  @Permissions({ module: PermissionModule.QUOTE, action: PermissionAction.UPDATE })
  @ApiOperation({ summary: 'Update a quote (Admin only)' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateQuoteDto) {
    const result = await this.quotesService.update(id, dto);
    return {
      data: result,
      message: 'Cập nhật câu nói thành công',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions({ module: PermissionModule.QUOTE, action: PermissionAction.DELETE })
  @ApiOperation({ summary: 'Soft-delete a quote (Admin only)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.quotesService.softDelete(id);
    return {
      message: 'Xóa câu nói thành công',
    };
  }
}
