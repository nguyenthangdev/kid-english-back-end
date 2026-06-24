import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { type Request, type Response } from 'express';
import { AuthService } from './auth.service';
import { LoginAdminDto } from './dto/login-admin.dto';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
import { ChangeAdminPasswordDto } from './dto/change-admin-password.dto';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { LoginRateLimitGuard } from '../common/guards/login-rate-limit.guard';
import {
  getAuthCookieOptions,
  parseCookies,
} from '../common/utils/cookie.util';
import type { AdminRequest } from '../common/types/admin-request.type';
import { type UploadedImageFile } from '../common/types/upload.type';

@Controller('admin')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('auth/login')
  @UseGuards(LoginRateLimitGuard)
  async loginAdmin(
    @Body() loginAdminDto: LoginAdminDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.loginAdmin(loginAdminDto);
    if (!result.isSuccess) {
      return {
        code: result.code,
        message: result.message,
      };
    }
    response.cookie(
      'accessToken',
      result.accessToken,
      getAuthCookieOptions('1h'),
    );
    response.cookie(
      'refreshToken',
      result.refreshToken,
      getAuthCookieOptions('14d'),
    );

    return {
      code: 200,
      message: 'Đăng nhập thành công!',
      accountAdmin: result.accountAdmin,
      role: result.role,
    };
  }

  @Post('auth/refresh-token')
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { refreshToken } = parseCookies(request.headers.cookie);
    const result = await this.authService.refreshTokenAdmin(refreshToken);
    if (!result.isSuccess) {
      return {
        code: result.code,
        message: result.message,
      };
    }
    response.cookie(
      'accessToken',
      result.newAccessToken,
      getAuthCookieOptions('1h'),
    );
    response.cookie(
      'refreshToken',
      result.newRefreshToken,
      getAuthCookieOptions('14d'),
    );

    return {
      code: 200,
      message: 'Làm mới accessToken thành công!',
    };
  }

  @Get('me')
  @UseGuards(AdminAuthGuard)
  me(@Req() request: AdminRequest) {
    return {
      code: 200,
      message: 'Lấy thông tin quản trị thành công!',
      accountAdmin: request.accountAdmin,
      role: request.accountAdminRole,
    };
  }

  @Patch('me')
  @UseGuards(AdminAuthGuard)
  async updateMe(
    @Req() request: AdminRequest,
    @Body() updateAdminProfileDto: UpdateAdminProfileDto,
  ) {
    const result = await this.authService.updateAdminProfile(
      request.accountAdmin?.id ?? '',
      updateAdminProfileDto,
    );

    return {
      code: 200,
      message: 'Cập nhật hồ sơ thành công!',
      accountAdmin: result.accountAdmin,
      role: result.role,
    };
  }

  @Patch('me/password')
  @UseGuards(AdminAuthGuard)
  async changePassword(
    @Req() request: AdminRequest,
    @Body() changeAdminPasswordDto: ChangeAdminPasswordDto,
  ) {
    await this.authService.changeAdminPassword(
      request.accountAdmin?.id ?? '',
      changeAdminPasswordDto,
    );

    return {
      code: 200,
      message: 'Đổi mật khẩu thành công!',
    };
  }

  @Post('me/avatar')
  @UseGuards(AdminAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Req() request: AdminRequest,
    @UploadedFile() avatar: UploadedImageFile,
  ) {
    const result = await this.authService.uploadAdminAvatar(
      request.accountAdmin?.id ?? '',
      avatar,
    );

    return {
      code: 200,
      message: 'Cập nhật ảnh đại diện thành công!',
      accountAdmin: result.accountAdmin,
      role: result.role,
    };
  }

  @Post('auth/logout')
  logout(@Res({ passthrough: true }) response: Response) {
    this.clearAuthCookies(response);

    return {
      code: 200,
      message: 'Đăng xuất thành công!',
    };
  }

  @Post('auth/logout-all')
  @UseGuards(AdminAuthGuard)
  logoutAll(@Res({ passthrough: true }) response: Response) {
    this.clearAuthCookies(response);

    return {
      code: 200,
      message: 'Đăng xuất thành công tất cả thiết bị!',
    };
  }

  private clearAuthCookies(response: Response) {
    response.clearCookie('accessToken', getAuthCookieOptions('1h'));
    response.clearCookie('refreshToken', getAuthCookieOptions('14d'));
  }
}
