import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Quote } from './entities/quote.entity';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QuoteQueryDto } from './dto/quote-query.dto';
import { CursorPaginatedResult } from '../common/types/pagination.type';
import { removeAccents } from '../common/utils/string.util';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);
  private readonly CACHE_PREFIX = 'quote:list';

  constructor(
    @InjectRepository(Quote)
    private readonly quoteRepository: Repository<Quote>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) { }

  async listQuotes(
    query: QuoteQueryDto,
  ): Promise<CursorPaginatedResult<Quote>> {
    const { tagId, keyword, cursor, limit = 20 } = query;
    // const cacheKey = `${this.CACHE_PREFIX}:${tagId ?? 'all'}:${cursor ?? 'start'}:${limit}`;

    // const cached =
    //   await this.cacheManager.get<CursorPaginatedResult<Quote>>(cacheKey);
    // if (cached) {
    //   this.logger.debug(`Cache hit: ${cacheKey}`);
    //   return cached;
    // }

    const qb = this.quoteRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.tag', 'tag')
      .where('quote.isDeleted = :isDeleted', { isDeleted: false });

    if (tagId) {
      qb.andWhere('quote.tagId = :tagId', { tagId });
    }

    if (keyword) {
      const cleanKeyword = keyword.trim();
      const unaccentedKeyword = removeAccents(cleanKeyword).toLowerCase();

      qb.andWhere(
        new Brackets((qbInner) => {
          qbInner
            .where('quote.contentEn ILIKE :rawKey', {
              rawKey: `%${cleanKeyword}%`,
            })
            .orWhere('quote.contentVn ILIKE :rawKey', {
              rawKey: `%${cleanKeyword}%`,
            })
            .orWhere('quote.author ILIKE :rawKey', {
              rawKey: `%${cleanKeyword}%`,
            });
        }),
      );
    }

    if (cursor) {
      const cursorItem = await this.quoteRepository.findOne({
        where: { id: cursor },
        select: { id: true, createdAt: true },
      });
      if (cursorItem) {
        qb.andWhere(
          '(quote.createdAt < :cursorDate OR (quote.createdAt = :cursorDate AND quote.id < :cursorId))',
          { cursorDate: cursorItem.createdAt, cursorId: cursorItem.id },
        );
      }
    }

    const items = await qb
      .orderBy('quote.createdAt', 'DESC')
      .addOrderBy('quote.id', 'DESC')
      .take(limit + 1)
      .getMany();

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    const result: CursorPaginatedResult<Quote> = { data, nextCursor, hasMore };
    // await this.cacheManager.set(cacheKey, result, 3600000);
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
    if (dto.tagId) {
      quote.tag = { id: dto.tagId } as any;
    }
    await this.quoteRepository.save(quote);
    const result = await this.findById(id); // Lấy lại đủ relation (Tag)

    this.logger.log(`Updated quote: ${result.id}`);
    return result;
  }

  async softDelete(id: string): Promise<void> {
    const quote = await this.findById(id);
    quote.isDeleted = true;
    await this.quoteRepository.save(quote);
    this.logger.log(`Soft-deleted quote: ${quote.id}`);
  }
}
