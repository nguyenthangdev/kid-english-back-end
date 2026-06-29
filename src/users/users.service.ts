import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Not, In } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  /**
   * Find a user by ID. Used by JWT strategy and admin endpoints.
   * Password is excluded from the result.
   */
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, isDeleted: false },
      relations: { role: { permissions: true } },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        isActive: true,
        isDeleted: true,
        roleId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  /**
   * Find a user by email — returns password hash for auth validation.
   * Only used by AuthService internally.
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, isDeleted: false },
      relations: { role: { permissions: true } },
    });
  }

  /**
   * Paginated list of all non-deleted users. Admin only.
   */
  async findAll(query: QueryUserDto): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const whereClause = search
      ? [
        { fullName: ILike(`%${search}%`), isDeleted: false },
        { email: ILike(`%${search}%`), isDeleted: false },
      ]
      : { isDeleted: false };

    const [data, total] = await this.userRepository.findAndCount({
      where: whereClause,
      relations: { role: true },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update a user's own profile (fullName, avatarUrl).
   */
  async updateProfile(id: string, dto: UpdateUserDto): Promise<User> {
    try {
      const userExists = await this.userRepository.exists({
        where: { id, isDeleted: false },
      });
      if (!userExists) {
        throw new NotFoundException(`User with ID "${id}" not found`);
      }
      await this.userRepository.update(id, dto);
      this.logger.log(`Updated profile for user ID: ${id}`);

      return this.findById(id);
    } catch (error) {
      this.logger.error(
        `Failed to update user ID ${id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Soft-delete a user. Admin only.
   */
  async softDelete(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.update(id, {
      isDeleted: true,
      isActive: false,
    });
    this.logger.log(`Soft-deleted user: ${user.email}`);
  }

  // --- ADMIN ACCOUNT MANAGEMENT ---

  async findAdministrators(query: QueryUserDto): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const baseWhere = { role: { code: Not('STUDENT') }, isDeleted: false };
    const whereClause = search
      ? [
        { ...baseWhere, fullName: ILike(`%${search}%`) },
        { ...baseWhere, email: ILike(`%${search}%`) },
      ]
      : baseWhere;

    const [data, total] = await this.userRepository.findAndCount({
      where: whereClause,
      relations: { role: true },
      order: { createdAt: 'DESC' },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
        avatarUrl: true,
        roleId: true,
        createdAt: true,
      },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createAdmin(dto: any) {
    const bcrypt = require('bcrypt');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const newAdmin = this.userRepository.create({
      fullName: dto.fullName,
      email: dto.email,
      password: hashedPassword,
      roleId: dto.roleId,
      isActive: dto.isActive,
    });
    return this.userRepository.save(newAdmin);
  }

  async updateAdmin(id: string, dto: any) {
    const admin = await this.findById(id);

    // Không cho phép update password trực tiếp qua endpoint này
    if (dto.password) delete dto.password;

    await this.userRepository.update(id, dto);
    return this.findById(id);
  }

  // --- REGULAR USER MANAGEMENT ---

  async findRegularUsers(query: QueryUserDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const baseWhere = { role: { code: In(['STUDENT', 'USER']) }, isDeleted: false };
    const whereClause = search
      ? [
        { ...baseWhere, fullName: ILike(`%${search}%`) },
        { ...baseWhere, email: ILike(`%${search}%`) },
      ]
      : baseWhere;

    const [data, total] = await this.userRepository.findAndCount({
      where: whereClause,
      relations: { role: true, vocabularyProgresses: true, streak: true },
      order: { createdAt: 'DESC' },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
        avatarUrl: true,
        roleId: true,
        createdAt: true,
      },
      skip,
      take: limit,
    });

    const mappedData = data.map((user: any) => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      isActive: user.isActive,
      avatarUrl: user.avatarUrl,
      roleId: user.roleId,
      createdAt: user.createdAt,
      role: user.role,
      wordsLearned: user.vocabularyProgresses?.filter((p: any) => p.status === 'MASTERED')?.length || 0,
      streak: user.streak?.currentStreak || 0,
    }));

    return {
      data: mappedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateRegularUser(id: string, dto: any) {
    await this.userRepository.update(id, dto);
    return this.findById(id);
  }
}
