import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../../auth/admin-auth/admin-auth.service';
import { AdminRequest } from '../types/admin-request.type';
import { parseCookies } from '../utils/cookie.util';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminRequest>();

    // 1. Lấy chuỗi Cookie thô từ Header của Request
    const rawCookies = request.headers.cookie;

    // 2. Parse chuỗi cookie thành Object để lấy accessToken
    const cookies = parseCookies(rawCookies);
    const accessToken = cookies['accessToken'];

    if (!accessToken) {
      throw new UnauthorizedException({
        code: 401,
        message: 'Vui lòng gửi kèm token!',
      });
    }

    const { accountAdmin, role } =
      await this.authService.validateAdminAccessToken(accessToken);

    request.accountAdmin = accountAdmin;
    request.accountAdminRole = role;

    return true;
  }
}
