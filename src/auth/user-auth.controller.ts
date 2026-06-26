import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { type Request, type Response } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiGoneResponse,
} from '@nestjs/swagger';
import { UserAuthService } from './user-auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { LoginRateLimitGuard } from '../common/guards/login-rate-limit.guard';
import { JwtUserAuthGuard } from '../common/guards/jwt-user-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  getAuthCookieOptions,
  parseCookies,
} from '../common/utils/cookie.util';
import type { AuthenticatedUser } from '../common/types/user-request.type';

@ApiTags('User - Auth')
@Controller('user/auth')
export class UserAuthController {
  constructor(private readonly userAuthService: UserAuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account (role: STUDENT)' })
  @ApiCreatedResponse({ description: 'Registration successful' })
  @ApiConflictResponse({ description: 'Email already exists' })
  async register(@Body() dto: RegisterUserDto) {
    const result = await this.userAuthService.register(dto);
    if (!result.isSuccess) {
      return {
        code: result.code,
        message: result.message,
      };
    }
    return {
      code: result.code,
      message: result.message,
      user: result.user,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LoginRateLimitGuard)
  @ApiOperation({
    summary: 'Login — tokens set in HttpOnly cookies AND returned in body',
    description:
      'Web apps consume cookies automatically. ' +
      'Mobile apps read accessToken / refreshToken from the response body.',
  })
  @ApiOkResponse({ description: 'Login successful' })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or account locked',
  })
  async login(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.userAuthService.login(dto);

    if (!result.isSuccess) {
      // Return the business error payload without setting cookies
      return { code: result.code, message: result.message };
    }

    // Set HttpOnly cookies (web consumers)
    res.cookie(
      'user_accessToken',
      result.accessToken,
      getAuthCookieOptions('7d'),
    );
    res.cookie(
      'user_refreshToken',
      result.refreshToken,
      getAuthCookieOptions('30d'),
    );

    return {
      code: 200,
      message: 'Đăng nhập thành công!',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
      role: result.role,
    };
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renew access + refresh tokens',
    description:
      'Reads refreshToken from cookie (web) or request body (mobile). ' +
      'New tokens are set as HttpOnly cookies AND returned in body.',
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
    @Req() req: Request,
    @Body('refreshToken') bodyToken: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies['user_refreshToken'] ?? bodyToken;

    if (!token) {
      throw new UnauthorizedException('Vui lòng cung cấp refreshToken!');
    }

    const result = await this.userAuthService.refreshToken(token);

    res.cookie(
      'user_accessToken',
      result.newAccessToken,
      getAuthCookieOptions('7d'),
    );
    res.cookie(
      'user_refreshToken',
      result.newRefreshToken,
      getAuthCookieOptions('30d'),
    );

    return {
      code: 200,
      message: 'Làm mới token thành công!',
      accessToken: result.newAccessToken,
      refreshToken: result.newRefreshToken,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout — clears HttpOnly cookies' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('user_accessToken', getAuthCookieOptions('7d'));
    res.clearCookie('user_refreshToken', getAuthCookieOptions('30d'));
    return { code: 200, message: 'Đăng xuất thành công!' };
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtUserAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.userAuthService.getMe(user.id);
  }
}
