import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { type Request, type Response } from 'express';
import { AuthService } from './admin-auth.service';
import { LoginAdminDto } from '../dto/login-admin.dto';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { LoginRateLimitGuard } from '../../common/guards/rate-limit-login.guard';
import {
  getAuthCookieOptions,
  parseCookies,
} from '../../common/utils/cookie.util';
import {
  ApiBody,
  ApiGoneResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Admin - Auth')
@Controller('admin')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LoginRateLimitGuard)
  @ApiOperation({
    summary: 'Login — tokens set in HttpOnly cookies',
    description:
      'Web apps consume cookies automatically. ' +
      'Mobile apps read accessToken / refreshToken from the response body.',
  })
  @ApiOkResponse({ description: 'Login successful' })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or account locked',
  })
  async loginAdmin(
    @Body() loginAdminDto: LoginAdminDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.loginAdmin(loginAdminDto);

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
      message: 'Đăng nhập thành công!',
      accountAdmin: result.accountAdmin,
      role: result.role,
    };
  }

  @Post('auth/refresh-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Renew access + refresh tokens',
    description:
      'Reads refreshToken from cookie (web) or request body (mobile). ' +
      'New tokens are set as HttpOnly cookies',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { refreshToken: { type: 'string' } },
    },
    required: false,
    description: 'Optional — send refreshToken in body for mobile clients.',
  })
  @ApiOkResponse({ description: 'Tokens renewed' })
  @ApiUnauthorizedResponse({ description: 'Invalid token' })
  @ApiGoneResponse({ description: 'Refresh token expired — re-login required' })
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { refreshToken } = parseCookies(request.headers.cookie);
    const result = await this.authService.refreshTokenAdmin(refreshToken);

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

    return { message: 'Làm mới accessToken thành công!' };
  }

  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout — clear tokens in HttpOnly cookies',
  })
  logout(@Res({ passthrough: true }) response: Response) {
    this.clearAuthCookies(response);

    return { message: 'Đăng xuất thành công!' };
  }

  @Post('auth/logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminAuthGuard)
  logoutAll(@Res({ passthrough: true }) response: Response) {
    this.clearAuthCookies(response);

    return { message: 'Đăng xuất thành công tất cả thiết bị!' };
  }

  private clearAuthCookies(response: Response) {
    response.clearCookie('accessToken', getAuthCookieOptions('1h'));
    response.clearCookie('refreshToken', getAuthCookieOptions('14d'));
  }
}
