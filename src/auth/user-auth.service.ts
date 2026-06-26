import {
  ConflictException,
  GoneException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository, DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { UserStreak } from '../users/entities/user-streak.entity';
import { UserStatistics } from '../users/entities/user-statistics.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtPayload } from '../common/types/jwt.type';

const DEFAULT_USER_ROLE = 'STUDENT';
const BCRYPT_ROUNDS = 12;
const DUMMY_BCRYPT_HASH =
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgRTkSHECjC1AkP0UkgE1i';

@Injectable()
export class UserAuthService {
  private readonly logger = new Logger(UserAuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  async register(dto: RegisterUserDto) {
    // 1. Kiểm tra Email (Fail-fast)
    const existing = await this.usersRepository.findOne({
      where: { email: dto.email, isDeleted: false },
    });
    if (existing) {
      return {
        isSuccess: false,
        code: 409,
        message: 'Email đã được sử dụng. Vui lòng chọn email khác!',
      };
    }

    const role = await this.findRoleByCode(DEFAULT_USER_ROLE);
    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // 2. KHỞI TẠO TRANSACTION (Bảo vệ Data Integrity)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 2.1 Tạo User
      const user = this.usersRepository.create({
        fullName: dto.fullName,
        email: dto.email,
        password: hashedPassword,
        avatarUrl: dto.avatarUrl,
        roleId: role.id,
        isActive: true,
        isDeleted: false,
      });
      // Dùng queryRunner để thực thi lưu vào DB theo Transaction
      const savedUser = await queryRunner.manager.save(user);

      // 2.2 Khởi tạo bảng Gamification (Streak & Statistics) với giá trị 0
      // Điều này cứu sống Backend khỏi hàng loạt lỗi Null Pointer Exception sau này
      const userStreak = queryRunner.manager.create(UserStreak, {
        userId: savedUser.id,
        currentStreak: 0,
        highestStreak: 0,
      });
      await queryRunner.manager.save(userStreak);

      const userStats = queryRunner.manager.create(UserStatistics, {
        userId: savedUser.id,
        totalStars: 0,
        // Nếu schema có thêm trường khác, init ở đây
      });
      await queryRunner.manager.save(userStats);

      // 2.3 Chốt Transaction
      await queryRunner.commitTransaction();
      this.logger.log(
        `New user registered successfully with gamification init: ${savedUser.email}`,
      );

      return {
        code: 201,
        isSuccess: true,
        message: 'Đăng ký thành công. Vui lòng đăng nhập!',
        user: this.serializeUser(savedUser),
      };
    } catch (error) {
      // Nếu có bất kỳ lỗi nào (DB sập, lỗi syntax...), hủy bỏ toàn bộ thao tác
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Registration failed for ${dto.email}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error; // Quăng lại lỗi cho Global Filter xử lý
    } finally {
      // Giải phóng connection pool
      await queryRunner.release();
    }
  }

  async login(dto: LoginUserDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email, isDeleted: false },
      relations: { role: true },
    });

    const passwordToCheck = user?.password ?? DUMMY_BCRYPT_HASH;
    const isMatch = await bcrypt.compare(dto.password, passwordToCheck);

    if (!user || !isMatch) {
      return {
        isSuccess: false,
        code: 401,
        message: 'Email hoặc mật khẩu không chính xác!',
      };
    }

    if (!user.isActive) {
      return {
        isSuccess: false,
        code: 403,
        message: 'Tài khoản đã bị khóa!',
      };
    }

    if (user.role?.code === 'ADMIN') {
      return {
        isSuccess: false,
        code: 403,
        message: 'Vui lòng sử dụng cổng đăng nhập quản trị!',
      };
    }

    const payload = this.createPayload(user);

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.getAccessTokenSecret(),
        expiresIn: '1h',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.getRefreshTokenSecret(),
        expiresIn: '14d',
      }),
    ]);

    return {
      isSuccess: true,
      accessToken,
      refreshToken,
      user: this.serializeUser(user),
      role: this.serializeRole(user.role),
    };
  }

  async refreshToken(token: string) {
    const decoded = await this.verifyRefreshToken(token);
    const user = await this.findActiveUserById(decoded.accountId);

    const payload = this.createPayload(user);

    // FIX SECURITY: Tương tự như trên
    const [newAccessToken, newRefreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.getAccessTokenSecret(),
        expiresIn: '1h',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.getRefreshTokenSecret(),
        expiresIn: '30d',
      }),
    ]);

    return { isSuccess: true, newAccessToken, newRefreshToken };
  }

  async getMe(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId, isDeleted: false, isActive: true },
      relations: { role: true },
    });
    if (!user) {
      throw new NotFoundException('Tài khoản không tồn tại!');
    }
    return {
      user: this.serializeUser(user),
      role: this.serializeRole(user.role),
    };
  }
  private async findRoleByCode(code: string): Promise<Role> {
    const role = await this.rolesRepository.findOne({
      where: { code, isDeleted: false },
    });
    if (!role) {
      throw new NotFoundException(
        `Không tìm thấy vai trò "${code}". Hãy chạy seed trước!`,
      );
    }
    return role;
  }

  private async findActiveUserById(accountId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: accountId, isDeleted: false, isActive: true },
      relations: { role: true },
    });
    if (!user) {
      throw new NotFoundException('Tài khoản không tồn tại!');
    }
    return user;
  }

  private createPayload(user: User): JwtPayload {
    return {
      accountId: user.id,
      email: user.email,
      roleId: user.roleId,
    };
  }

  private async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.getRefreshTokenSecret(),
      });
    } catch (error) {
      // Re-throw as a typed NestJS exception so the global filter formats it
      const message = error instanceof Error ? error.message : '';
      if (message.includes('jwt expired')) {
        throw new GoneException('Phiên đã hết hạn, vui lòng đăng nhập lại!');
      }
      throw new UnauthorizedException(
        'Token không hợp lệ, vui lòng đăng nhập lại!',
      );
    }
  }

  private getAccessTokenSecret(): string {
    return this.configService.getOrThrow<string>(
      'JWT_ACCESS_TOKEN_SECRET_USER',
    );
  }

  private getRefreshTokenSecret(): string {
    return this.configService.getOrThrow<string>(
      'JWT_REFRESH_TOKEN_SECRET_USER',
    );
  }

  private serializeUser(user: User) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl ?? null,
      isActive: user.isActive,
      roleId: user.roleId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private serializeRole(role?: Role | null) {
    if (!role) return null;
    return {
      id: role.id,
      name: role.name,
      code: role.code,
    };
  }
}
