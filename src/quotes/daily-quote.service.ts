import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Cron } from '@nestjs/schedule';
import { Quote } from './entities/quote.entity';
import { DailyQuote } from './entities/daily-quote.entity';

export const DAILY_QUOTE_CACHE_KEY = 'quote:today';
const ONE_DAY_MS = 86400 * 1000;

@Injectable()
export class DailyQuoteService {
  private readonly logger = new Logger(DailyQuoteService.name);

  constructor(
    @InjectRepository(Quote)
    private readonly quoteRepository: Repository<Quote>,
    @InjectRepository(DailyQuote)
    private readonly dailyQuoteRepository: Repository<DailyQuote>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * Runs at midnight UTC every day.
   * Selects a random active quote and saves it as today's daily quote.
   */
  @Cron('0 0 * * *', { name: 'daily-quote-cron', timeZone: 'UTC' })
  async selectDailyQuote(): Promise<void> {
    this.logger.log('Running daily quote selection cron...');

    try {
      const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      // Check if already set for today (idempotent)
      const existing = await this.dailyQuoteRepository.findOne({
        where: { date: todayStr },
      });
      if (existing) {
        this.logger.log(`Daily quote already set for ${todayStr}, skipping.`);
        return;
      }

      // Pick a random non-deleted quote
      const quote = await this.quoteRepository
        .createQueryBuilder('quote')
        .where('quote.isDeleted = :isDeleted', { isDeleted: false })
        .orderBy('RANDOM()')
        .limit(1)
        .getOne();

      if (!quote) {
        this.logger.warn('No available quotes found for daily selection');
        return;
      }

      // Persist to daily_quotes
      const dailyQuote = this.dailyQuoteRepository.create({
        quoteId: quote.id,
        date: todayStr,
      });
      await this.dailyQuoteRepository.save(dailyQuote);

      // Cache with 24h TTL
      await this.cacheManager.set(DAILY_QUOTE_CACHE_KEY, quote, ONE_DAY_MS);

      this.logger.log(
        `Daily quote set for ${todayStr}: "${quote.contentEn.substring(0, 50)}..."`,
      );
    } catch (error) {
      this.logger.error('Failed to select daily quote', error);
    }
  }

  /**
   * Get today's quote — from Redis cache first, fallback to DB.
   */
  async getTodayQuote(): Promise<Quote | null> {
    const cached = await this.cacheManager.get<Quote>(DAILY_QUOTE_CACHE_KEY);
    if (cached) return cached;

    const todayStr = new Date().toISOString().split('T')[0];
    const daily = await this.dailyQuoteRepository.findOne({
      where: { date: todayStr },
      relations: { quote: true },
    });

    if (!daily?.quote) {
      this.logger.log(
        'No quote found for today. Triggering selectDailyQuote() manually.',
      );
      await this.selectDailyQuote();
      const newlyCached = await this.cacheManager.get<Quote>(
        DAILY_QUOTE_CACHE_KEY,
      );
      return newlyCached || null;
    }

    await this.cacheManager.set(DAILY_QUOTE_CACHE_KEY, daily.quote, ONE_DAY_MS);
    return daily.quote;
  }
}
