import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { type Request, type Response } from 'express';
import { AuthService } from './auth.service';
import { LoginAdminDto } from './dto/login-admin.dto';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { LoginRateLimitGuard } from './guards/login-rate-limit.guard';
import {
  getAuthCookieOptions,
  parseCookies,
} from '../common/utils/cookie.util';
import type { AdminRequest } from './types/admin-request.type';

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
