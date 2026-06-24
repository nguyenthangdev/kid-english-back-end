import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  private readonly CACHE_VERSION_KEY = 'vocab:cache_version';

  constructor(
    @InjectRepository(Vocabulary)
    private readonly vocabularyRepository: Repository<Vocabulary>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  private async getCacheVersion(): Promise<number> {
    let version = await this.cacheManager.get<number>(this.CACHE_VERSION_KEY);
    if (!version) {
      version = Date.now();
      await this.cacheManager.set(this.CACHE_VERSION_KEY, version, 0);
    }
    return version;
  }

  async listVocabularies(
    query: VocabularyQueryDto,
  ): Promise<CursorPaginatedResult<Vocabulary>> {
    const { tagId, cursor, limit = 20 } = query;

    // 1. Nhúng Version vào Cache Key
    const version = await this.getCacheVersion();
    const cacheKey = `${this.CACHE_PREFIX}:v${version}:${tagId ?? 'all'}:${cursor ?? 'start'}:${limit}`;

    const cached =
      await this.cacheManager.get<CursorPaginatedResult<Vocabulary>>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return cached;
    }

    const qb = this.vocabularyRepository
      .createQueryBuilder('vocab')
      // FIX OVERFETCHING: Chỉ lấy những trường UI thực sự cần từ bảng Tag
      .leftJoin('vocab.tag', 'tag')
      .addSelect(['tag.id', 'tag.name', 'tag.colorCode', 'tag.slug'])
      .where('vocab.isDeleted = :isDeleted', { isDeleted: false });

    if (tagId) {
      qb.andWhere('vocab.tagId = :tagId', { tagId });
    }

    if (cursor) {
      const cursorItem = await this.vocabularyRepository.findOne({
        where: { id: cursor },
        select: { id: true, createdAt: true },
      });

      if (cursorItem) {
        qb.andWhere(
          '(vocab.createdAt < :cursorDate OR (vocab.createdAt = :cursorDate AND vocab.id < :cursorId))',
          { cursorDate: cursorItem.createdAt, cursorId: cursorItem.id },
        );
      }
    }

    // Luôn sắp xếp bằng 2 cột tương ứng với logic Where ở trên
    const items = await qb
      .orderBy('vocab.createdAt', 'DESC')
      .addOrderBy('vocab.id', 'DESC')
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

    // TTL 1 giờ. Khi có version mới, key này sẽ bị "bỏ rơi" và Redis sẽ tự dọn rác khi hết giờ.
    await this.cacheManager.set(cacheKey, result, 3600000);

    return result;
  }

  async findById(id: string): Promise<Vocabulary> {
    const vocab = await this.vocabularyRepository.findOne({
      where: { id, isDeleted: false },
      relations: { tag: true },
    });
    if (!vocab) {
      throw new NotFoundException(`Không tìm thấy từ vựng với ID "${id}"`);
    }
    return vocab;
  }

  async create(dto: CreateVocabularyDto): Promise<Vocabulary> {
    const vocab = this.vocabularyRepository.create(dto);
    const saved = await this.vocabularyRepository.save(vocab);
    await this.invalidateCaches();
    this.logger.log(`Created vocabulary: ${saved.word}`);
    return saved;
  }

  async update(id: string, dto: UpdateVocabularyDto): Promise<Vocabulary> {
    const vocab = await this.findById(id);
    Object.assign(vocab, dto);
    const updated = await this.vocabularyRepository.save(vocab);
    await this.invalidateCaches();
    this.logger.log(`Updated vocabulary: ${updated.word}`);
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    const vocab = await this.findById(id);
    vocab.isDeleted = true;
    await this.vocabularyRepository.save(vocab);
    await this.invalidateCaches();
    this.logger.log(`Soft-deleted vocabulary: ${vocab.word}`);
  }

  private async invalidateCaches(): Promise<void> {
    const newVersion = Date.now();

    // Ghi đè version mới. Lập tức mọi Cache Key List cũ trở nên "vô hình" với request mới.
    await this.cacheManager.set(this.CACHE_VERSION_KEY, newVersion, 0);

    this.logger.log(
      `[Cache Invalidated] Đã nâng version namespace lên v${newVersion}. Hệ thống đồng bộ toàn cục.`,
    );
  }
}
