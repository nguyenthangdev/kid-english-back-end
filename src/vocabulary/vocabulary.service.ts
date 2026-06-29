import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Vocabulary } from './entities/vocabulary.entity';
import { CreateVocabularyDto } from './dto/create-vocabulary.dto';
import { UpdateVocabularyDto } from './dto/update-vocabulary.dto';
import { VocabularyQueryDto } from './dto/vocabulary-query.dto';
import { StorageService } from '../storage/storage.service';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { UploadedImageFile } from '../common/types/upload.type';
import { removeAccents } from '../common/utils/string.util';
import { CursorPaginatedResult } from '../common/types/pagination.type';

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
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) { }

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
    const { tagId, keyword, cursor, limit = 10 } = query;
    // const cacheKey = `${this.CACHE_PREFIX}:${tagId ?? 'all'}:${cursor ?? 'start'}:${limit}`;

    // 1. Nhúng Version vào Cache Key
    // const version = await this.getCacheVersion();
    // const cacheKey = `${this.CACHE_PREFIX}:v${version}:${tagId ?? 'all'}:${cursor ?? 'start'}:${limit}`;

    // const cached =
    //   await this.cacheManager.get<CursorPaginatedResult<Vocabulary>>(cacheKey);
    // if (cached) {
    //   this.logger.debug(`Cache hit: ${cacheKey}`);
    //   return cached;
    // }
    const qb = this.vocabularyRepository
      .createQueryBuilder('vocab')
      .leftJoin('vocab.tag', 'tag')
      .addSelect(['tag.id', 'tag.name', 'tag.colorCode', 'tag.slug'])
      .where('vocab.isDeleted = :isDeleted', { isDeleted: false });

    if (tagId) {
      qb.andWhere('vocab.tagId = :tagId', { tagId });
    }

    if (keyword) {
      const unaccentedKeyword = removeAccents(keyword).toLowerCase();

      qb.andWhere(
        new Brackets((qbInner) => {
          qbInner
            .where('vocab.word ILIKE :rawKey', {
              rawKey: `%${keyword.trim()}%`,
            })
            .orWhere('vocab.meaning ILIKE :rawKey', {
              rawKey: `%${keyword.trim()}%`,
            })

            .orWhere('vocab.searchText ILIKE :cleanKey', {
              cleanKey: `%${unaccentedKeyword}%`,
            });
        }),
      );
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
    // await this.cacheManager.set(cacheKey, result, 3600000);

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
    // 1. Tạo chuỗi tìm kiếm không dấu trước khi lưu
    const rawText = `${dto.word} ${dto.meaning}`;
    const cleanSearchText = removeAccents(rawText).toLowerCase();

    // 2. Gán searchText vào cùng với dữ liệu từ DTO
    const vocab = this.vocabularyRepository.create({
      ...dto,
      searchText: cleanSearchText,
    });

    const saved = await this.vocabularyRepository.save(vocab);
    // await this.invalidateCaches();
    this.logger.log(`Created vocabulary: ${saved.word}`);
    return saved;
  }

  async update(id: string, dto: UpdateVocabularyDto): Promise<Vocabulary> {
    const vocab = await this.findById(id);
    // 1. Cập nhật dữ liệu mới (dto) đè lên dữ liệu cũ (vocab)
    Object.assign(vocab, dto);
    if (dto.tagId) {
      vocab.tag = { id: dto.tagId } as any;
    }
    // 2. TÍNH TOÁN LẠI searchText
    // Lưu ý: Phải dùng vocab.word và vocab.meaning (dữ liệu sau khi gộp)
    const rawText = `${vocab.word} ${vocab.meaning}`;
    vocab.searchText = removeAccents(rawText).toLowerCase();

    await this.vocabularyRepository.save(vocab);
    const result = await this.findById(id); // Gọi lại findById để lấy đủ relation (Tag)

    // await this.invalidateCaches();
    this.logger.log(`Updated vocabulary: ${result.word}`);
    return result;
  }

  async softDelete(id: string): Promise<void> {
    const vocab = await this.findById(id);
    vocab.isDeleted = true;
    await this.vocabularyRepository.save(vocab);
    // await this.invalidateCaches(); // Bump version cache để xóa cache cũ
    this.logger.log(`Soft-deleted vocabulary: ${vocab.word}`);
  }

  async uploadImage(file?: UploadedImageFile): Promise<string> {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn ảnh minh họa!');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File tải lên phải là hình ảnh!');
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('Kích thước ảnh không được vượt quá 2MB!');
    }

    const extension = file.originalname.split('.').pop() || 'jpg';
    const path = `vocabularies/${randomUUID()}.${extension}`;

    // Đồng bộ cách lấy bucket name giống hàm uploadAdminAvatar
    const bucket =
      this.configService.get<string>('SUPABASE_STORAGE_BUCKET') ||
      'kid-english';

    // await this.invalidateCaches();
    return await this.storageService.uploadFile(bucket, path, file);

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
