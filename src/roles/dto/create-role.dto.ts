import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    example: 'Content Manager',
    description: 'Display name of the role',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'CONTENT_MANAGER',
    description: 'Unique role code (uppercase, no spaces)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({ example: 'Manages vocabulary and quotes content' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}
