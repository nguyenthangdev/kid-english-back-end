import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { TagType } from '../../common/constants/enums';

export class CreateTagDto {
  @ApiProperty({
    description: 'Tên của tag',
    example: 'Từ vựng IELTS',
  })
  @IsString()
  @IsNotEmpty({ message: 'Tên tag không được để trống' })
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Phân loại của tag',
    enum: TagType,
    example: TagType.VOCAB,
  })
  @IsEnum(TagType, { message: 'Loại tag không hợp lệ' })
  type: TagType;

  @ApiPropertyOptional({
    description: 'Mã màu hiển thị trên UI',
    example: 'green',
  })
  @IsString()
  @IsOptional()
  colorCode?: string;

  @ApiPropertyOptional({
    description: 'Đường dẫn ảnh thu nhỏ của tag',
    example: 'https://example.com/images/tag-thumbnail.png',
  })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;
}
