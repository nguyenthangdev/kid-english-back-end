import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  MaxLength,
  IsUrl,
} from 'class-validator';

export class CreateQuoteDto {
  @ApiProperty({
    example: 'The only way to do great work is to love what you do.',
  })
  @IsString()
  @IsNotEmpty()
  contentEn: string;

  @ApiProperty({
    example: 'Cách duy nhất để làm việc tốt là yêu thích những gì bạn làm.',
  })
  @IsString()
  @IsNotEmpty()
  contentVn: string;

  @ApiPropertyOptional({ example: 'Steve Jobs' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  author?: string;

  @ApiPropertyOptional({ example: 'https://example.com/audio.mp3' })
  @IsUrl()
  @IsOptional()
  audioUrl?: string;

  @ApiProperty({ example: 'uuid-of-tag' })
  @IsUUID()
  @IsNotEmpty()
  tagId: string;
}
