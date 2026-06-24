import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Min, Max, IsString } from 'class-validator';

export class VocabularyQueryDto {
  @ApiPropertyOptional({ description: 'Filter by tag UUID' })
  @IsUUID()
  @IsOptional()
  tagId?: string;

  @ApiPropertyOptional({
    description: 'Cursor: last vocabulary ID from previous page',
  })
  @IsUUID()
  @IsOptional()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Number of items to fetch', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  keyword?: string;
}
