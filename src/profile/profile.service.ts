import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { StorageService } from '../storage/storage.service';
import { ChangeAdminPasswordDto } from './dto/change-admin-password.dto';
import { UploadedImageFile } from '../common/types/upload.type';
import { randomUUID } from 'crypto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
  ) {}

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
      throw new BadRequestException('Mật khẩu hiện tại không chính xác!');
    }

    accountAdmin.password = await bcrypt.hash(dto.newPassword, 10);
    await this.usersRepository.save(accountAdmin);
  }

  async uploadAdminAvatar(accountId: string, file?: UploadedImageFile) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn ảnh đại diện!');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File tải lên phải là hình ảnh!');
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('Ảnh đại diện không được vượt quá 2MB!');
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
