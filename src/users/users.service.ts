import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
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
  ) {}

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
    const user = await this.findById(id);
    Object.assign(user, dto);
    const updated = await this.userRepository.save(user);
    this.logger.log(`Updated profile for user: ${updated.email}`);
    return updated;
  }

  /**
   * Soft-delete a user. Admin only.
   */
  async softDelete(id: string): Promise<void> {
    const user = await this.findById(id);
    user.isDeleted = true;
    user.isActive = false;
    await this.userRepository.save(user);
    this.logger.log(`Soft-deleted user: ${user.email}`);
  }
}
