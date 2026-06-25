import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { JwtPayload } from '../types/jwt.type';
import { AuthenticatedUser } from '../types/user-request.type';
import { Request } from 'express';

/** Allowed role codes for the user-facing app */
const USER_ALLOWED_ROLES = new Set(['STUDENT', 'TEACHER']);

@Injectable()
export class JwtUserStrategy extends PassportStrategy(Strategy, 'jwt-user') {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const token = request?.cookies?.['user_accessToken'];
          return token || null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>(
        'JWT_ACCESS_TOKEN_SECRET_USER',
      ),
    });
  }

  /**
   * Called after the token signature is verified successfully.
   * The returned value is set as `request.user`.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersRepository.findOne({
      where: {
        id: payload.accountId,
        isDeleted: false,
        isActive: true,
      },
      relations: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Token hợp lệ nhưng tài khoản không tồn tại hoặc đã bị vô hiệu hóa.',
      );
    }

    if (!USER_ALLOWED_ROLES.has(user.role?.code)) {
      throw new UnauthorizedException(
        'Tài khoản không có quyền truy cập ứng dụng người dùng.',
      );
    }

    return {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      roleCode: user.role.code,
    };
  }
}
