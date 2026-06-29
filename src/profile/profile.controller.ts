import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  UseGuards,
  Req,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { type AdminRequest } from '../common/types/admin-request.type';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
import { ChangeAdminPasswordDto } from './dto/change-admin-password.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { type UploadedImageFile } from '../common/types/upload.type';

@Controller('admin/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminAuthGuard)
  getProfile(@Req() request: AdminRequest) {
    return {
      message: 'Lấy thông tin quản trị thành công!',
      accountAdmin: request.accountAdmin,
      role: request.accountAdminRole,
    };
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminAuthGuard)
  async updateProfile(
    @Req() request: AdminRequest,
    @Body() updateAdminProfileDto: UpdateAdminProfileDto,
  ) {
    const result = await this.profileService.updateAdminProfile(
      request.accountAdmin?.id ?? '',
      updateAdminProfileDto,
    );

    return {
      message: 'Cập nhật hồ sơ thành công!',
      accountAdmin: result.accountAdmin,
      role: result.role,
    };
  }

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminAuthGuard)
  async changePassword(
    @Req() request: AdminRequest,
    @Body() changeAdminPasswordDto: ChangeAdminPasswordDto,
  ) {
    await this.profileService.changeAdminPassword(
      request.accountAdmin?.id ?? '',
      changeAdminPasswordDto,
    );

    return { message: 'Đổi mật khẩu thành công!' };
  }

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Req() request: AdminRequest,
    @UploadedFile() avatar: UploadedImageFile,
  ) {
    const result = await this.profileService.uploadAdminAvatar(
      request.accountAdmin?.id ?? '',
      avatar,
    );

    return {
      message: 'Cập nhật ảnh đại diện thành công!',
      accountAdmin: result.accountAdmin,
      role: result.role,
    };
  }
}
