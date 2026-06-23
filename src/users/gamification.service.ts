import {
  Injectable,
  Logger,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { UserStreak } from './entities/user-streak.entity';
import { UserActivity } from './entities/user-activity.entity';
import { ActiveType, TargetType } from '../common/constants/enums';

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * Records a user activity and atomically updates streak + stars.
   * Uses a DB transaction with row-level locking.
   */
  async recordActivity(
    userId: string,
    activeType: ActiveType,
    targetType: TargetType = TargetType.NONE,
    targetId?: string,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

      // ── 1. Fetch & lock UserStreak ──────────────────────────────────────
      let streak = await queryRunner.manager.findOne(UserStreak, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });

      // Create streak record if first activity
      if (!streak) {
        streak = queryRunner.manager.create(UserStreak, {
          userId,
          currentStreak: 0,
          highestStreak: 0,
        } as UserStreak);
      }

      // ── 2. Calculate streak ────────────────────────────────────────────
      const lastActive = streak.lastActiveDate
        ? new Date(streak.lastActiveDate).toISOString().split('T')[0]
        : null;

      if (lastActive !== todayStr) {
        if (lastActive) {
          const diffDays = Math.floor(
            (today.getTime() - new Date(lastActive).getTime()) / 86400000,
          );
          if (diffDays === 1) {
            streak.currentStreak += 1;
          } else {
            streak.currentStreak = 1; // reset
          }
        } else {
          streak.currentStreak = 1; // first ever activity
        }

        streak.lastActiveDate = today;
        if (streak.currentStreak > streak.highestStreak) {
          streak.highestStreak = streak.currentStreak;
        }
        await queryRunner.manager.save(UserStreak, streak);
      }

      // ── 3. Upsert UserStatistics & increment stars ────────────────────
      await queryRunner.manager.query(
        `
        INSERT INTO user_statistics (user_id, total_stars, total_words_learned, created_at, updated_at)
        VALUES ($1, 1, 0, NOW(), NOW())
        ON CONFLICT (user_id) DO UPDATE
        SET total_stars = user_statistics.total_stars + 1,
            updated_at = NOW()
        `,
        [userId],
      );

      // ── 4. Log user_activity ─────────────────────────────────────────
      const activity = queryRunner.manager.create(UserActivity, {
        userId,
        activeType,
        targetType,
        ...(targetId ? { targetId } : {}),
      } as UserActivity);
      await queryRunner.manager.save(UserActivity, activity);

      await queryRunner.commitTransaction();

      // ── 5. Invalidate user's dashboard cache ────────────────────────
      await this.cacheManager.del(`dashboard:${userId}`);

      this.logger.log(
        `Activity recorded: user=${userId} type=${activeType} streak=${streak.currentStreak}`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to record activity for user ${userId}`, error);
      throw new InternalServerErrorException('Failed to record activity');
    } finally {
      await queryRunner.release();
    }
  }
}
