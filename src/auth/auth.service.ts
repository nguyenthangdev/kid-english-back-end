import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { StorageService } from '../storage/storage.service';
import { LoginAdminDto } from './dto/login-admin.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './types/jwt.type';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
import { ChangeAdminPasswordDto } from './dto/change-admin-password.dto';

type UploadedAvatarFile = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly storageService: StorageService,
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

    if (!accountAdmin) {
      return {
        isSuccess: false,
        code: 401,
        message: 'Tài khoản hoặc mật khẩu không chính xác!',
      };
    }

    const isMatch = await bcrypt.compare(
      loginAdminDto.password,
      accountAdmin.password,
    );

    if (!isMatch) {
      return {
        isSuccess: false,
        code: 401,
        message: 'Tài khoản hoặc mật khẩu không chính xác!',
      };
    }

    if (!accountAdmin.isActive) {
      return {
        isSuccess: false,
        code: 403,
        message: 'Tài khoản đã bị khóa!',
      };
    }

    const role = await this.findRoleById(accountAdmin.roleId);

    if (!this.isAdminRole(role)) {
      return {
        isSuccess: false,
        code: 403,
        message: 'Tài khoản không có quyền quản trị!',
      };
    }

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
      isSuccess: true,
      accessToken,
      refreshToken,
      accountAdmin: this.serializeAdmin(accountAdmin),
      role: this.serializeRole(role),
    };
  }

  async refreshTokenAdmin(refreshToken?: string) {
    if (!refreshToken) {
      return {
        isSuccess: false,
        code: 401,
        message: 'Không tồn tại refreshToken!',
      };
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

    return { isSuccess: true, newAccessToken, newRefreshToken };
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

    if (!this.isAdminRole(role)) {
      throw new ForbiddenException({
        message: 'Tài khoản không có quyền quản trị!',
      });
    }

    return {
      accountAdmin: this.serializeAdmin(accountAdmin),
      role: this.serializeRole(role),
    };
  }

  async updateAdminProfile(accountId: string, dto: UpdateAdminProfileDto) {
    const accountAdmin = await this.findActiveAdminById(accountId);
    accountAdmin.fullName = dto.fullName.trim();

    const updated = await this.usersRepository.save(accountAdmin);
    const role = await this.findRoleById(updated.roleId);

    return {
      accountAdmin: this.serializeAdmin(updated),
      role: this.serializeRole(role),
    };
  }

  async changeAdminPassword(accountId: string, dto: ChangeAdminPasswordDto) {
    const accountAdmin = await this.findActiveAdminById(accountId);
    const isMatch = await bcrypt.compare(
      dto.currentPassword,
      accountAdmin.password,
    );

    if (!isMatch) {
      throw new UnauthorizedException({
        code: 401,
        message: 'Mật khẩu hiện tại không chính xác!',
      });
    }

    accountAdmin.password = await bcrypt.hash(dto.newPassword, 10);
    await this.usersRepository.save(accountAdmin);

    return { isSuccess: true };
  }

  async uploadAdminAvatar(accountId: string, file?: UploadedAvatarFile) {
    if (!file) {
      throw new BadRequestException({
        code: 400,
        message: 'Vui lòng chọn ảnh đại diện!',
      });
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException({
        code: 400,
        message: 'File tải lên phải là hình ảnh!',
      });
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException({
        code: 400,
        message: 'Ảnh đại diện không được vượt quá 2MB!',
      });
    }

    const accountAdmin = await this.findActiveAdminById(accountId);
    const extension = file.originalname.split('.').pop() || 'jpg';
    const path = `admin-avatars/${accountId}/${randomUUID()}.${extension}`;
    const bucket =
      this.configService.get<string>('SUPABASE_STORAGE_BUCKET') ||
      'kid-english';
    const avatarUrl = await this.storageService.uploadFile(bucket, path, file);

    accountAdmin.avatarUrl = avatarUrl;
    const updated = await this.usersRepository.save(accountAdmin);
    const role = await this.findRoleById(updated.roleId);

    return {
      accountAdmin: this.serializeAdmin(updated),
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
      throw new NotFoundException({
        code: 404,
        message: 'Tài khoản không tồn tại!',
      });
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
      throw new ForbiddenException({
        code: 403,
        message: 'Không thể xác định quyền tài khoản!',
      });
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
      throw new GoneException({ message: 'Cần refresh token mới!' });
    }

    throw new UnauthorizedException({
      message: 'Token không hợp lệ, vui lòng đăng nhập lại!',
    });
  }

  private getAccessTokenSecret() {
    return this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET_ADMIN');
  }

  private getRefreshTokenSecret() {
    return this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET_ADMIN');
  }

  private isAdminRole(role: Role) {
    return role.code === 'ADMIN';
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
