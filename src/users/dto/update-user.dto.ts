import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;
}
