import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max, IsString } from 'class-validator';

export class QueryUserDto {
  @ApiPropertyOptional({ description: 'Page number (1-indexed)', example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search by email or full name' })
  @IsString()
  @IsOptional()
  search?: string;
}
