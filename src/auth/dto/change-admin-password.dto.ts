import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangeAdminPasswordDto {
  @ApiProperty({ example: 'old-password' })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu hiện tại không được để trống!' })
  currentPassword: string;

  @ApiProperty({ example: 'new-password' })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống!' })
  @MinLength(6, { message: 'Mật khẩu mới phải chứa ít nhất 6 ký tự!' })
  newPassword: string;
}
