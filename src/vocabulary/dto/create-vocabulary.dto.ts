import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  MaxLength,
  IsUrl,
} from 'class-validator';

export class CreateVocabularyDto {
  @ApiProperty({ example: 'apple', description: 'The English word' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  word: string;

  @ApiProperty({ example: 'quả táo', description: 'Vietnamese meaning' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  meaning: string;

  @ApiPropertyOptional({ example: '/ˈæpəl/', description: 'IPA pronunciation' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  pronunciation?: string;

  @ApiPropertyOptional({ example: 'https://example.com/apple.jpg' })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({
    example: 'uuid-of-tag',
    description: 'Tag UUID to associate this vocabulary with',
  })
  @IsUUID()
  @IsNotEmpty()
  tagId: string;
}
