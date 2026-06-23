import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({
      where: { isDeleted: false },
      relations: { permissions: true },
      order: { name: 'ASC' },
    });
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
      throw new ConflictException(
        `Role with code "${createRoleDto.code}" already exists`,
      );
    }

    const role = this.roleRepository.create(createRoleDto);
    const saved = await this.roleRepository.save(role);
    this.logger.log(`Created role: ${saved.code}`);
    return saved;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findById(id);

    if (updateRoleDto.code && updateRoleDto.code !== role.code) {
      const existing = await this.roleRepository.exists({
        where: { code: updateRoleDto.code },
      });
      if (existing) {
        throw new ConflictException(
          `Role with code "${updateRoleDto.code}" already exists`,
        );
      }
    }

    Object.assign(role, updateRoleDto);
    const updated = await this.roleRepository.save(role);
    this.logger.log(`Updated role: ${updated.code}`);
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    const role = await this.findById(id);
    role.isDeleted = true;
    await this.roleRepository.save(role);
    this.logger.log(`Soft-deleted role: ${role.code}`);
  }
}
