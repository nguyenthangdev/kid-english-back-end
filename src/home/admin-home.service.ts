import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { User } from '../users/entities/user.entity';
import { Vocabulary } from '../vocabulary/entities/vocabulary.entity';
import { Quote } from '../quotes/entities/quote.entity';
import { Tag } from '../tag/entities/tag.entity';
import { UserVocabularyProgress } from '../users/entities/user-vocabulary-progress.entity';
import { UserActivity } from '../users/entities/user-activity.entity';
import { UserStatistics } from '../users/entities/user-statistics.entity';
import { ProgressStatus } from '../common/constants/enums';
import {
  AdminDashboardResponseDto,
  PlatformOverviewDto,
  LearningActivityDto,
  // TopUserDto,
  // RecentActivityDto,
} from './dto/admin-dashboard-response.dto';

/** Cache key for the admin dashboard — same data for all admins */
const ADMIN_DASHBOARD_CACHE_KEY = 'admin:dashboard';

/** TTL = 60s: admin needs fresh data but we still protect DB from hammering */
const ADMIN_DASHBOARD_TTL_MS = 60 * 1000;

@Injectable()
export class AdminHomeService {
  private readonly logger = new Logger(AdminHomeService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Vocabulary)
    private readonly vocabRepo: Repository<Vocabulary>,
    @InjectRepository(Quote)
    private readonly quoteRepo: Repository<Quote>,
    @InjectRepository(Tag)
    private readonly tagRepo: Repository<Tag>,
    @InjectRepository(UserVocabularyProgress)
    private readonly progressRepo: Repository<UserVocabularyProgress>,
    @InjectRepository(UserActivity)
    private readonly activityRepo: Repository<UserActivity>,
    @InjectRepository(UserStatistics)
    private readonly statisticsRepo: Repository<UserStatistics>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async getAdminDashboard(): Promise<AdminDashboardResponseDto> {
    // ── 1. Cache-Aside ────────────────────────────────────────────────────────
    const cached = await this.cacheManager.get<AdminDashboardResponseDto>(
      ADMIN_DASHBOARD_CACHE_KEY,
    );
    if (cached) {
      this.logger.debug('Admin dashboard cache hit');
      return cached;
    }

    // ── 2. Parallel DB aggregations ───────────────────────────────────────────
    const [
      totalUsers,
      activeUsers,
      totalVocabularies,
      totalQuotes,
      totalTags,
      totalProgressRecords,
      masteredRecords,
      // topUsers,
      // recentActivities,
    ] = await Promise.all([
      this.countUsers(),
      this.countActiveUsers(),
      this.countVocabularies(),
      this.countQuotes(),
      this.countTags(),
      this.countProgressRecords(),
      this.countMasteredRecords(),
      // this.fetchTopUsers(),
      // this.fetchRecentActivities(),
    ]);

    // ── 3. Compose ────────────────────────────────────────────────────────────
    const masteryRatio =
      totalProgressRecords > 0
        ? parseFloat((masteredRecords / totalProgressRecords).toFixed(4))
        : 0;

    const overview: PlatformOverviewDto = {
      totalUsers,
      activeUsers,
      totalVocabularies,
      totalQuotes,
      totalTags,
    };

    const learningActivity: LearningActivityDto = {
      totalProgressRecords,
      masteredRecords,
      masteryRatio,
    };

    const result: AdminDashboardResponseDto = {
      overview,
      learningActivity,
      // topUsers,
      // recentActivities,
      cachedAt: new Date().toISOString(),
    };

    // ── 4. Cache ──────────────────────────────────────────────────────────────
    await this.cacheManager.set(
      ADMIN_DASHBOARD_CACHE_KEY,
      result,
      ADMIN_DASHBOARD_TTL_MS,
    );
    this.logger.debug('Admin dashboard cached (TTL: 60s)');

    return result;
  }

  /**
   * Invalidate the admin dashboard cache.
   * Call this from any service that mutates aggregate-impacting data
   * (user CRUD, vocabulary CRUD, quote CRUD, etc.).
   */
  async invalidateCache(): Promise<void> {
    await this.cacheManager.del(ADMIN_DASHBOARD_CACHE_KEY);
    this.logger.debug('Admin dashboard cache invalidated');
  }

  // ─── Private query helpers ─────────────────────────────────────────────────

  private countUsers(): Promise<number> {
    return this.userRepo.count({ where: { isDeleted: false } });
  }

  private countActiveUsers(): Promise<number> {
    return this.userRepo.count({ where: { isDeleted: false, isActive: true } });
  }

  private countVocabularies(): Promise<number> {
    return this.vocabRepo.count({ where: { isDeleted: false } });
  }

  private countQuotes(): Promise<number> {
    return this.quoteRepo.count({ where: { isDeleted: false } });
  }

  private countTags(): Promise<number> {
    return this.tagRepo.count({ where: { isDeleted: false } });
  }

  private countProgressRecords(): Promise<number> {
    return this.progressRepo.count();
  }

  private countMasteredRecords(): Promise<number> {
    return this.progressRepo.count({
      where: { status: ProgressStatus.MASTERED },
    });
  }

  /**
   * Top 10 users by total_stars.
   * Uses a JOIN to pull streak data in the same query round-trip.
   */
  // private async fetchTopUsers(): Promise<TopUserDto[]> {
  //   const rows = await this.statisticsRepo
  //     .createQueryBuilder('stats')
  //     .innerJoin('stats.user', 'user')
  //     .leftJoin('user.streak', 'streak')
  //     .where('user.isDeleted = :deleted', { deleted: false })
  //     .select([
  //       'stats.userId              AS "userId"',
  //       'user.fullName             AS "fullName"',
  //       'user.email                AS "email"',
  //       'stats.totalStars          AS "totalStars"',
  //       'stats.totalWordsLearned   AS "totalWordsLearned"',
  //       'COALESCE(streak.currentStreak, 0) AS "currentStreak"',
  //     ])
  //     .orderBy('stats.totalStars', 'DESC')
  //     .limit(10)
  //     .getRawMany<{
  //       userId: string;
  //       fullName: string;
  //       email: string;
  //       totalStars: string;
  //       totalWordsLearned: string;
  //       currentStreak: string;
  //     }>();

  //   return rows.map((r) => ({
  //     userId: r.userId,
  //     fullName: r.fullName,
  //     email: r.email,
  //     totalStars: parseInt(r.totalStars, 10),
  //     totalWordsLearned: parseInt(r.totalWordsLearned, 10),
  //     currentStreak: parseInt(r.currentStreak, 10),
  //   }));
  // }

  /**
   * Latest 20 activity records joined with user's full name.
   */
  // private async fetchRecentActivities(): Promise<RecentActivityDto[]> {
  //   const rows = await this.activityRepo
  //     .createQueryBuilder('activity')
  //     .innerJoin('activity.user', 'user')
  //     .where('user.isDeleted = :deleted', { deleted: false })
  //     .select([
  //       'activity.id          AS "activityId"',
  //       'activity.userId      AS "userId"',
  //       'user.fullName        AS "userFullName"',
  //       'activity.activeType  AS "activeType"',
  //       'activity.targetType  AS "targetType"',
  //       'activity.targetId    AS "targetId"',
  //       'activity.createdAt   AS "occurredAt"',
  //     ])
  //     .orderBy('activity.createdAt', 'DESC')
  //     .limit(20)
  //     .getRawMany<{
  //       activityId: string;
  //       userId: string;
  //       userFullName: string;
  //       activeType: string;
  //       targetType: string;
  //       targetId: string | null;
  //       occurredAt: Date;
  //     }>();

  //   return rows.map((r) => ({
  //     activityId: r.activityId,
  //     userId: r.userId,
  //     userFullName: r.userFullName,
  //     activeType: r.activeType,
  //     targetType: r.targetType,
  //     targetId: r.targetId ?? null,
  //     occurredAt: new Date(r.occurredAt).toISOString(),
  //   }));
  // }
}
