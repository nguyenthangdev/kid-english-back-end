import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateAdminProfileDto {
  @ApiProperty({ example: 'System Administrator' })
  @IsString()
  @IsNotEmpty({ message: 'Họ và tên không được để trống!' })
  @MaxLength(100, { message: 'Họ và tên không được vượt quá 100 ký tự!' })
  fullName: string;
}
