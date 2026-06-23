import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Min, Max } from 'class-validator';

export class QuoteQueryDto {
  @ApiPropertyOptional({ description: 'Filter by tag UUID' })
  @IsUUID()
  @IsOptional()
  tagId?: string;

  @ApiPropertyOptional({ description: 'Cursor: last quote ID from previous page' })
  @IsUUID()
  @IsOptional()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Number of items to fetch', example: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
