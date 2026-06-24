import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { JwtPayload } from '../types/jwt.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>(
        'JWT_ACCESS_TOKEN_SECRET_ADMIN',
      ),
    });
  }

  /**
   * Called after the token signature is verified successfully.
   * The returned value is set as `request.user`.
   */
  async validate(payload: JwtPayload): Promise<RequestUserContext> {
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

    // Map accountId → id so @CurrentUser() always provides user.id
    return {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      role: user.role ?? undefined,
    };
  }
}

/**
 * Shape of the authenticated user attached to request.user
 * after JwtAuthGuard verifies the token.
 */
export interface RequestUserContext {
  id: string;
  email: string;
  roleId: string;
  role?: { id: string; code: string; name: string };
}
