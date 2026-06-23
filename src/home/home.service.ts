import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { UserStreak } from '../users/entities/user-streak.entity';
import { UserStatistics } from '../users/entities/user-statistics.entity';
import { ProgressService } from '../users/progress.service';
import { DailyQuoteService } from '../quotes/daily-quote.service';
import {
  DashboardResponseDto,
  StreakDto,
  StatisticsDto,
} from './dto/dashboard-response.dto';

const DASHBOARD_TTL_MS = 180 * 1000; // 3 minutes

@Injectable()
export class HomeService {
  private readonly logger = new Logger(HomeService.name);

  constructor(
    @InjectRepository(UserStreak)
    private readonly streakRepository: Repository<UserStreak>,
    @InjectRepository(UserStatistics)
    private readonly statisticsRepository: Repository<UserStatistics>,
    private readonly progressService: ProgressService,
    private readonly dailyQuoteService: DailyQuoteService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async getDashboard(userId: string): Promise<DashboardResponseDto> {
    const cacheKey = `dashboard:${userId}`;

    // ── 1. Cache-Aside: try Redis first ─────────────────────────────────
    const cached = await this.cacheManager.get<DashboardResponseDto>(cacheKey);
    if (cached) {
      this.logger.debug(`Dashboard cache hit for user: ${userId}`);
      return cached;
    }

    // ── 2. Parallel DB + cache fetches ───────────────────────────────────
    const [streak, statistics, progressStats, quoteOfDay] = await Promise.all([
      this.streakRepository.findOne({ where: { userId } }),
      this.statisticsRepository.findOne({ where: { userId } }),
      this.progressService.getProgressStats(userId),
      this.dailyQuoteService.getTodayQuote(),
    ]);

    // ── 3. Compose response ──────────────────────────────────────────────
    const streakDto: StreakDto = {
      currentStreak: streak?.currentStreak ?? 0,
      highestStreak: streak?.highestStreak ?? 0,
      lastActiveDate: streak?.lastActiveDate
        ? new Date(streak.lastActiveDate).toISOString().split('T')[0]
        : null,
    };

    const statisticsDto: StatisticsDto = {
      totalStars: statistics?.totalStars ?? 0,
      totalWordsLearned: statistics?.totalWordsLearned ?? 0,
    };

    const result: DashboardResponseDto = {
      streak: streakDto,
      statistics: statisticsDto,
      vocabularyProgress: progressStats,
      quoteOfDay: quoteOfDay
        ? {
            id: quoteOfDay.id,
            contentEn: quoteOfDay.contentEn,
            contentVn: quoteOfDay.contentVn,
            author: quoteOfDay.author,
          }
        : null,
    };

    // ── 4. Cache for 3 minutes ───────────────────────────────────────────
    await this.cacheManager.set(cacheKey, result, DASHBOARD_TTL_MS);
    this.logger.debug(`Dashboard cached for user: ${userId} (TTL: 3min)`);

    return result;
  }
}
