import {
  Injectable,
  Logger,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { Role } from '../roles/entities/role.entity';
import { PermissionAction, PermissionModule } from '../common/constants/enums';

@Injectable()
export class PermissionsService implements OnModuleInit {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.seedPermissions();
  }

  private async seedPermissions() {
    const count = await this.permissionRepository.count();
    if (count > 0) {
      return;
    }

    this.logger.log(
      '🌱 Bảng Permissions đang trống. Bắt đầu auto-seed dữ liệu mẫu...',
    );

    const moduleNames = {
      VOCABULARY: 'từ vựng',
      QUOTE: 'câu nói',
      USER: 'người dùng',
    };
    const actionNames = {
      CREATE: 'Thêm',
      READ: 'Xem',
      UPDATE: 'Sửa',
      DELETE: 'Xóa',
    };

    const generatedPermissions: any = [];
    for (const mod of Object.values(PermissionModule)) {
      for (const act of Object.values(PermissionAction)) {
        generatedPermissions.push({
          module: mod,
          action: act,
          code: `${mod}_${act}`, // VD: VOCABULARY_READ
          description: `${actionNames[act]} ${moduleNames[mod]}`,
        });
      }
    }
    const entities = this.permissionRepository.create(generatedPermissions);
    await this.permissionRepository.save(entities);

    this.logger.log('✅ Auto-seed dữ liệu Permissions thành công!');
  }

  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.find({
      where: { isDeleted: false },
      order: { module: 'ASC', action: 'ASC' },
    });
  }

  async saveMatrix(
    matrix: Record<string, { permissions: string[]; version: number }>,
  ): Promise<any> {
    const allPerms = await this.permissionRepository.find({
      where: { isDeleted: false },
    });

    // Vẫn dùng Transaction để gom nhóm các tác vụ, giúp đảm bảo tính ACID
    await this.dataSource.transaction(async (manager) => {
      for (const [roleId, data] of Object.entries(matrix)) {
        const role = await manager.findOne(Role, { where: { id: roleId } });

        if (!role || role.code === 'ADMIN') continue;
        if (
          data.version !== undefined &&
          Number(data.version) !== role.version
        ) {
          throw new ConflictException(
            `Nhóm quyền "${role.name}" vừa bị một quản trị viên khác thay đổi. Vui lòng tải lại trang để xem bản cập nhật mới nhất!`,
          );
        }
        role.permissions = allPerms.filter((p) =>
          data.permissions.includes(p.code),
        );
        await manager.save(role);
        // ÉP TĂNG VERSION VÀ KHÓA LẠC QUAN CẤP DATABASE
        const updateResult = await manager.update(
          Role,
          { id: role.id, version: role.version },
          { version: role.version + 1 },
        );
        if (updateResult.affected === 0) {
          throw new ConflictException(
            `Nhóm quyền "${role.name}" vừa bị một quản trị viên khác thay đổi. Vui lòng tải lại trang để xem bản cập nhật mới nhất!`,
          );
        }
      }
    });

    this.logger.log('Cập nhật ma trận phân quyền thành công (Optimistic)');
    return { success: true, message: 'Lưu phân quyền thành công!' };
  }
}
