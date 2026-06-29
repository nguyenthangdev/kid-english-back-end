import { ConfigService } from '@nestjs/config';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TooManyRequestsException } from '../exceptions/too-many-request.exception';

// Khởi tạo một bộ nhớ Map lưu trữ: IP -> { số lần thử, thời gian bắt đầu }
const rateLimitMap = new Map<string, { count: number; startTime: number }>();

@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Lấy IP của người dùng (hỗ trợ cả khi chạy qua Proxy/Load Balancer)
    const ip = request.ip || request.headers['x-forwarded-for'];

    const now = Date.now();
    const WINDOW_MS = this.configService.get<number>('WINDOW_MS')!;
    const MAX_ATTEMPTS = this.configService.get<number>('MAX_ATTEMPTS')!;

    const record = rateLimitMap.get(ip);

    if (!record) {
      // Lần đầu tiên IP này thực hiện gọi API login
      rateLimitMap.set(ip, { count: 1, startTime: now });
      return true;
    }

    // Nếu đã qua 1 phút kể từ lần thử đầu tiên, reset lại bộ đếm
    if (now - record.startTime > WINDOW_MS) {
      rateLimitMap.set(ip, { count: 1, startTime: now });
      return true;
    }

    // Nếu vẫn trong vòng 1 phút, tăng số lần thử lên
    record.count += 1;

    if (record.count > MAX_ATTEMPTS) {
      throw new TooManyRequestsException(
        'Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau',
      );
    }

    return true;
  }
}
