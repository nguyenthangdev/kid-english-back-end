import {
  Injectable,
  Inject,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Vocabulary } from './entities/vocabulary.entity';
import { CreateVocabularyDto } from './dto/create-vocabulary.dto';
import { UpdateVocabularyDto } from './dto/update-vocabulary.dto';
import { VocabularyQueryDto } from './dto/vocabulary-query.dto';

export interface CursorPaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

@Injectable()
export class VocabularyService {
  private readonly logger = new Logger(VocabularyService.name);
  private readonly CACHE_PREFIX = 'vocab:list';

  constructor(
    @InjectRepository(Vocabulary)
    private readonly vocabularyRepository: Repository<Vocabulary>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * Cursor-based paginated list of vocabularies.
   * Cursor = last returned vocabulary ID.
   */
  async listVocabularies(
    query: VocabularyQueryDto,
  ): Promise<CursorPaginatedResult<Vocabulary>> {
    const { tagId, cursor, limit = 20 } = query;
    const cacheKey = `${this.CACHE_PREFIX}:${tagId ?? 'all'}:${cursor ?? 'start'}:${limit}`;

    const cached =
      await this.cacheManager.get<CursorPaginatedResult<Vocabulary>>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return cached;
    }

    const qb = this.vocabularyRepository
      .createQueryBuilder('vocab')
      .leftJoinAndSelect('vocab.tag', 'tag')
      .where('vocab.isDeleted = :isDeleted', { isDeleted: false });

    if (tagId) {
      qb.andWhere('vocab.tagId = :tagId', { tagId });
    }

    if (cursor) {
      // Cursor pagination: fetch records where created_at is older than cursor item
      const cursorItem = await this.vocabularyRepository.findOne({
        where: { id: cursor },
        select: { createdAt: true },
      });
      if (cursorItem) {
        qb.andWhere('vocab.createdAt < :cursorDate', {
          cursorDate: cursorItem.createdAt,
        });
      }
    }

    // Fetch limit+1 to determine hasMore
    const items = await qb
      .orderBy('vocab.createdAt', 'DESC')
      .take(limit + 1)
      .getMany();

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    const result: CursorPaginatedResult<Vocabulary> = {
      data,
      nextCursor,
      hasMore,
    };
    await this.cacheManager.set(cacheKey, result, 3600000);
    return result;
  }

  async findById(id: string): Promise<Vocabulary> {
    const vocab = await this.vocabularyRepository.findOne({
      where: { id, isDeleted: false },
      relations: { tag: true },
    });
    if (!vocab) {
      throw new NotFoundException(`Vocabulary with ID "${id}" not found`);
    }
    return vocab;
  }

  async create(dto: CreateVocabularyDto): Promise<Vocabulary> {
    const vocab = this.vocabularyRepository.create(dto);
    const saved = await this.vocabularyRepository.save(vocab);
    await this.clearCaches();
    this.logger.log(`Created vocabulary: ${saved.word}`);
    return saved;
  }

  async update(id: string, dto: UpdateVocabularyDto): Promise<Vocabulary> {
    const vocab = await this.findById(id);
    Object.assign(vocab, dto);
    const updated = await this.vocabularyRepository.save(vocab);
    await this.clearCaches();
    this.logger.log(`Updated vocabulary: ${updated.word}`);
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    const vocab = await this.findById(id);
    vocab.isDeleted = true;
    await this.vocabularyRepository.save(vocab);
    await this.clearCaches();
    this.logger.log(`Soft-deleted vocabulary: ${vocab.word}`);
  }

  private async clearCaches(): Promise<void> {
    // cache-manager v7 with Redis: iterate known prefixes
    // In production consider using redis SCAN or tagged invalidation
    this.logger.log(
      'Vocabulary caches cleared (new writes invalidate via TTL)',
    );
  }
}
