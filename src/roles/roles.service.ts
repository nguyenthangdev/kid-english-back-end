import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CursorPaginatedResult } from '../common/types/pagination.type';
import { RoleQueryDto } from './dto/role-query.dto';
import { removeAccents } from '../common/utils/string.util';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findAll(query: RoleQueryDto): Promise<CursorPaginatedResult<Role>> {
    const { keyword, cursor, limit = 10 } = query;

    const qb = this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permission')
      .where('role.isDeleted = :isDeleted', { isDeleted: false });

    if (keyword) {
      const cleanKeyword = keyword.trim();
      const unaccentedKeyword = removeAccents(cleanKeyword).toLowerCase();

      qb.andWhere(
        new Brackets((qbInner) => {
          qbInner
            .where('role.name ILIKE :key', { key: `%${cleanKeyword}%` })
            .orWhere('role.code ILIKE :key', { key: `%${cleanKeyword}%` })
            .orWhere('role.searchText ILIKE :cleanKey', {
              cleanKey: `%${unaccentedKeyword}%`,
            });
        }),
      );
    }

    if (cursor) {
      const cursorItem = await this.roleRepository.findOne({
        where: { id: cursor },
        select: { createdAt: true },
      });
      if (cursorItem) {
        qb.andWhere('role.createdAt < :cursorDate', {
          cursorDate: cursorItem.createdAt,
        });
      }
    }

    const items = await qb
      .orderBy('role.updatedAt', 'DESC')
      .take(limit + 1)
      .getMany();

    if (items.length > 0) {
      const roleIds = items.map((r) => r.id);

      // Query sang bảng User dựa trên relation đã thiết lập
      const counts = await this.roleRepository
        .createQueryBuilder('role')
        .leftJoin('role.users', 'user')
        .select('role.id', 'roleId')
        .addSelect('COUNT(user.id)', 'userCount')
        .where('role.id IN (:...roleIds)', { roleIds })
        .groupBy('role.id')
        .getRawMany();

      // Ghép kết quả đếm được vào từng Role
      items.forEach((role) => {
        const match = counts.find((c) => c.roleId === role.id);
        // Lưu ý: TypeORM COUNT() luôn trả về chuỗi (string) nên phải parseInt
        role.userCount = parseInt(match?.userCount || '0', 10);
      });
    }
    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    return { data, nextCursor, hasMore };
  }

  async findById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id, isDeleted: false },
      relations: { permissions: true },
    });
    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }
    return role;
  }

  async findByCode(code: string): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { code, isDeleted: false },
      relations: { permissions: true },
    });
  }

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const existing = await this.roleRepository.exists({
      where: { code: createRoleDto.code },
    });
    if (existing) {
      throw new ConflictException(`Mã code "${createRoleDto.code}" đã tồn tại`);
    }

    const cleanSearchText = removeAccents(createRoleDto.name).toLowerCase();

    const role = this.roleRepository.create({
      ...createRoleDto,
      searchText: cleanSearchText,
    });
    const saved = await this.roleRepository.save(role);
    this.logger.log(`Created role: ${saved.code}`);
    return saved;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findById(id);

    if (
      updateRoleDto.version !== undefined &&
      Number(updateRoleDto.version) !== role.version
    ) {
      throw new ConflictException(
        'Dữ liệu nhóm quyền này vừa được một quản trị viên khác cập nhật. Vui lòng tải lại trang để xem thay đổi mới nhất!',
      );
    }

    delete updateRoleDto.version;
    if (role.code === 'ADMIN') {
      throw new ForbiddenException(
        'Không được phép chỉnh sửa nhóm quyền ADMIN gốc.',
      );
    }

    if (updateRoleDto.code && updateRoleDto.code.toUpperCase() === 'ADMIN') {
      throw new ForbiddenException('Không được phép đổi mã quyền thành ADMIN.');
    }

    if (updateRoleDto.code && updateRoleDto.code !== role.code) {
      const existing = await this.roleRepository.exists({
        where: { code: updateRoleDto.code },
      });
      if (existing) {
        throw new ConflictException(
          `Mã code "${updateRoleDto.code}" đã tồn tại`,
        );
      }
    }

    Object.assign(role, updateRoleDto);
    role.searchText = removeAccents(role.name).toLowerCase();
    try {
      const updated = await this.roleRepository.save(role);
      this.logger.log(`Updated role: ${updated.code}`);
      return updated;
    } catch (error: any) {
      if (error.name === 'OptimisticLockVersionMismatchError') {
        throw new ConflictException(
          'Dữ liệu nhóm quyền này vừa được một quản trị viên khác cập nhật. Vui lòng tải lại trang để xem thay đổi mới nhất!',
        );
      }
      throw error;
    }
  }

  async softDelete(id: string): Promise<void> {
    const role = await this.findById(id);
    if (role.code === 'ADMIN') {
      throw new ForbiddenException('Không được phép xóa nhóm quyền ADMIN gốc.');
    }
    role.isDeleted = true;
    await this.roleRepository.save(role);
    this.logger.log(`Soft-deleted role: ${role.code}`);
  }
}
