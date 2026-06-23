import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Quote } from './entities/quote.entity';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QuoteQueryDto } from './dto/quote-query.dto';
import { CursorPaginatedResult } from '../vocabulary/vocabulary.service';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);
  private readonly CACHE_PREFIX = 'quote:list';

  constructor(
    @InjectRepository(Quote)
    private readonly quoteRepository: Repository<Quote>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async listQuotes(
    query: QuoteQueryDto,
  ): Promise<CursorPaginatedResult<Quote>> {
    const { tagId, cursor, limit = 20 } = query;
    const cacheKey = `${this.CACHE_PREFIX}:${tagId ?? 'all'}:${cursor ?? 'start'}:${limit}`;

    const cached =
      await this.cacheManager.get<CursorPaginatedResult<Quote>>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return cached;
    }

    const qb = this.quoteRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.tag', 'tag')
      .where('quote.isDeleted = :isDeleted', { isDeleted: false });

    if (tagId) {
      qb.andWhere('quote.tagId = :tagId', { tagId });
    }

    if (cursor) {
      const cursorItem = await this.quoteRepository.findOne({
        where: { id: cursor },
        select: { createdAt: true },
      });
      if (cursorItem) {
        qb.andWhere('quote.createdAt < :cursorDate', {
          cursorDate: cursorItem.createdAt,
        });
      }
    }

    const items = await qb
      .orderBy('quote.createdAt', 'DESC')
      .take(limit + 1)
      .getMany();

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    const result: CursorPaginatedResult<Quote> = { data, nextCursor, hasMore };
    await this.cacheManager.set(cacheKey, result, 3600000);
    return result;
  }

  async findById(id: string): Promise<Quote> {
    const quote = await this.quoteRepository.findOne({
      where: { id, isDeleted: false },
      relations: { tag: true },
    });
    if (!quote) {
      throw new NotFoundException(`Quote with ID "${id}" not found`);
    }
    return quote;
  }

  async create(dto: CreateQuoteDto): Promise<Quote> {
    const quote = this.quoteRepository.create(dto);
    const saved = await this.quoteRepository.save(quote);
    this.logger.log(`Created quote: ${saved.id}`);
    return saved;
  }

  async update(id: string, dto: UpdateQuoteDto): Promise<Quote> {
    const quote = await this.findById(id);
    Object.assign(quote, dto);
    const updated = await this.quoteRepository.save(quote);
    this.logger.log(`Updated quote: ${updated.id}`);
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    const quote = await this.findById(id);
    quote.isDeleted = true;
    await this.quoteRepository.save(quote);
    this.logger.log(`Soft-deleted quote: ${quote.id}`);
  }
}
