import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, Min, IsInt } from 'class-validator';
import { TagType } from '../../common/constants/enums';
import { Type } from 'class-transformer';

export class TagQueryDto {
  @ApiPropertyOptional({ enum: TagType })
  @IsOptional()
  @IsEnum(TagType)
  type?: TagType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
