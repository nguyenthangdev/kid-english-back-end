import {
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { User } from '../../users/entities/user.entity';
import { LoginAdminDto } from '../dto/login-admin.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../../common/types/jwt.type';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async loginAdmin(loginAdminDto: LoginAdminDto) {
    const accountAdmin = await this.usersRepository.findOne({
      where: {
        email: loginAdminDto.email,
        isDeleted: false,
      },
      relations: {
        role: true,
      },
    });
    if (!accountAdmin)
      throw new UnauthorizedException(
        'Tài khoản hoặc mật khẩu không chính xác',
      );

    const isMatch = await bcrypt.compare(
      loginAdminDto.password,
      accountAdmin.password,
    );

    if (!isMatch) {
      throw new UnauthorizedException(
        'Tài khoản hoặc mật khẩu không chính xác',
      );
    }

    if (!accountAdmin.isActive) {
      throw new ForbiddenException('Tài khoản đã bị khóa');
    }

    const role = await this.findRoleById(accountAdmin.roleId);

    const payload = this.createPayload(accountAdmin);

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.getAccessTokenSecret(),
      expiresIn: '1h',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.getRefreshTokenSecret(),
      expiresIn: '14d',
    });

    return {
      accessToken,
      refreshToken,
      accountAdmin: this.serializeAdmin(accountAdmin),
      role: this.serializeRole(role),
    };
  }

  async refreshTokenAdmin(refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const refreshTokenDecoded = await this.verifyRefreshToken(refreshToken);

    const accountAdmin = await this.findActiveAdminById(
      refreshTokenDecoded.accountId,
    );

    const payload = this.createPayload(accountAdmin);

    const newAccessToken = await this.jwtService.signAsync(payload, {
      secret: this.getAccessTokenSecret(),
      expiresIn: '1h',
    });

    const newRefreshToken = await this.jwtService.signAsync(payload, {
      secret: this.getRefreshTokenSecret(),
      expiresIn: '14d',
    });

    return { newAccessToken, newRefreshToken };
  }

  async validateAdminAccessToken(accessToken?: string) {
    if (!accessToken) {
      throw new UnauthorizedException({ message: 'Vui lòng gửi kèm token!' });
    }

    const accessTokenDecoded = await this.verifyAccessToken(accessToken);
    const accountAdmin = await this.findActiveAdminById(
      accessTokenDecoded.accountId,
    );
    const role = await this.findRoleById(accountAdmin.roleId);

    return {
      accountAdmin: this.serializeAdmin(accountAdmin),
      role: this.serializeRole(role),
    };
  }

  private async findActiveAdminById(accountId: string) {
    const accountAdmin = await this.usersRepository.findOne({
      where: {
        id: accountId,
        isDeleted: false,
        isActive: true,
      },
      relations: {
        role: true,
      },
    });

    if (!accountAdmin) {
      throw new NotFoundException('Tài khoản không tồn tại');
    }

    return accountAdmin;
  }

  private async findRoleById(roleId: string) {
    const role = await this.rolesRepository.findOne({
      where: {
        id: roleId,
        isDeleted: false,
      },
      relations: {
        permissions: true,
      },
    });

    if (!role) {
      throw new NotFoundException(
        'Nhóm quyền hiện tại của tài khoàn này không tồn tại hoặc bị khóa',
      );
    }

    return role;
  }

  private createPayload(accountAdmin: User): JwtPayload {
    return {
      accountId: accountAdmin.id,
      email: accountAdmin.email,
      roleId: accountAdmin.roleId,
    };
  }

  private async verifyAccessToken(accessToken: string) {
    try {
      return await this.jwtService.verifyAsync(accessToken, {
        secret: this.getAccessTokenSecret(),
      });
    } catch (error) {
      this.handleJwtError(error);
    }
  }

  private async verifyRefreshToken(refreshToken: string) {
    try {
      return await this.jwtService.verifyAsync(refreshToken, {
        secret: this.getRefreshTokenSecret(),
      });
    } catch (error) {
      this.handleJwtError(error);
    }
  }

  private handleJwtError(error: unknown): never {
    const message = error instanceof Error ? error.message : '';

    if (message.includes('jwt expired')) {
      throw new GoneException(
        'refresh token đã hết hạn, cần refresh token mới!',
      );
    }

    throw new UnauthorizedException(
      'Token không hợp lệ, vui lòng đăng nhập lại!',
    );
  }

  private getAccessTokenSecret() {
    return this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET_ADMIN');
  }

  private getRefreshTokenSecret() {
    return this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET_ADMIN');
  }

  private serializeAdmin(accountAdmin: User) {
    return {
      id: accountAdmin.id,
      fullName: accountAdmin.fullName,
      name: accountAdmin.fullName,
      email: accountAdmin.email,
      avatarUrl: accountAdmin.avatarUrl,
      isActive: accountAdmin.isActive,
      roleId: accountAdmin.roleId,
      createdAt: accountAdmin.createdAt,
      updatedAt: accountAdmin.updatedAt,
    };
  }

  private serializeRole(role: Role) {
    return {
      id: role.id,
      name: role.name,
      code: role.code,
      description: role.description,
      permissions:
        role.permissions?.map((permission) => ({
          id: permission.id,
          module: permission.module,
          action: permission.action,
          code: permission.code,
          description: permission.description,
        })) ?? [],
    };
  }
}
