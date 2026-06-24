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

  constructor(
    @InjectRepository(Vocabulary)
    private readonly vocabularyRepository: Repository<Vocabulary>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Cursor-based paginated list of vocabularies.
   * Cursor = last returned vocabulary ID.
   */
  async listVocabularies(
    query: VocabularyQueryDto,
  ): Promise<CursorPaginatedResult<Vocabulary>> {
    const { tagId, keyword, cursor, limit = 10 } = query;
    // const cacheKey = `${this.CACHE_PREFIX}:${tagId ?? 'all'}:${cursor ?? 'start'}:${limit}`;

    // const cached =
    //   await this.cacheManager.get<CursorPaginatedResult<Vocabulary>>(cacheKey);
    // if (cached) {
    //   this.logger.debug(`Cache hit: ${cacheKey}`);
    //   return cached;
    // }
    const qb = this.vocabularyRepository
      .createQueryBuilder('vocab')
      .leftJoinAndSelect('vocab.tag', 'tag')
      .where('vocab.isDeleted = :isDeleted', { isDeleted: false });

    if (tagId) {
      qb.andWhere('vocab.tagId = :tagId', { tagId });
    }

    // if (keyword) {
    //   const cleanKeyword = keyword.trim();
    //   const slugKeyword = convertToSlug(cleanKeyword);
    //   const unaccentedKeyword = removeAccents(cleanKeyword);
    //   console.log('cleanKeyword: ', cleanKeyword);
    //   console.log('slugKeyword: ', slugKeyword);
    //   console.log('unaccentedKeyword: ', unaccentedKeyword);
    //   // Bắt buộc dùng Brackets để bọc các khối OR lại (chống lỗi logic SQL: A AND (B OR C OR D))
    //   qb.andWhere(
    //     new Brackets((qbInner) => {
    //       qbInner
    //         // 1. Tìm theo từ khóa gốc
    //         .where('vocab.word ILIKE :clean', { clean: `%${cleanKeyword}%` })
    //         .orWhere('vocab.meaning ILIKE :clean', {
    //           clean: `%${cleanKeyword}%`,
    //         })

    //         // 2. Tìm theo từ khóa đã bỏ dấu tiếng Việt
    //         .orWhere('vocab.word ILIKE :unaccented', {
    //           unaccented: `%${unaccentedKeyword}%`,
    //         })
    //         .orWhere('vocab.meaning ILIKE :unaccented', {
    //           unaccented: `%${unaccentedKeyword}%`,
    //         })

    //         // 3. Tìm theo định dạng slug (gạch nối)
    //         .orWhere('vocab.word ILIKE :slug', { slug: `%${slugKeyword}%` })
    //         .orWhere('vocab.meaning ILIKE :slug', { slug: `%${slugKeyword}%` });
    //     }),
    //   );
    // }
    if (keyword) {
      // Gọt sạch dấu và in thường chữ của user gõ (VD: user gõ "quA cAm" -> "qua cam")
      const unaccentedKeyword = removeAccents(keyword).toLowerCase();

      qb.andWhere(
        new Brackets((qbInner) => {
          qbInner
            // 1. Vẫn tìm ở 2 cột gốc (đề phòng user gõ đúng 100% có dấu)
            .where('vocab.word ILIKE :rawKey', {
              rawKey: `%${keyword.trim()}%`,
            })
            .orWhere('vocab.meaning ILIKE :rawKey', {
              rawKey: `%${keyword.trim()}%`,
            })

            // 2. Tìm ở cột searchText đã gọt dấu
            .orWhere('vocab.searchText ILIKE :cleanKey', {
              cleanKey: `%${unaccentedKeyword}%`,
            });
        }),
      );
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
    // await this.cacheManager.set(cacheKey, result, 3600000);
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
    // 1. Tạo chuỗi tìm kiếm không dấu trước khi lưu
    const rawText = `${dto.word} ${dto.meaning}`;
    const cleanSearchText = removeAccents(rawText).toLowerCase();

    // 2. Gán searchText vào cùng với dữ liệu từ DTO
    const vocab = this.vocabularyRepository.create({
      ...dto,
      searchText: cleanSearchText,
    });

    const saved = await this.vocabularyRepository.save(vocab);
    // await this.clearCaches();
    this.logger.log(`Created vocabulary: ${saved.word}`);
    return saved;
  }

  async update(id: string, dto: UpdateVocabularyDto): Promise<Vocabulary> {
    const vocab = await this.findById(id);

    // 1. Cập nhật dữ liệu mới (dto) đè lên dữ liệu cũ (vocab)
    Object.assign(vocab, dto);

    // 2. TÍNH TOÁN LẠI searchText
    // Lưu ý: Phải dùng vocab.word và vocab.meaning (dữ liệu sau khi gộp)
    const rawText = `${vocab.word} ${vocab.meaning}`;
    vocab.searchText = removeAccents(rawText).toLowerCase();

    const updated = await this.vocabularyRepository.save(vocab);
    // await this.clearCaches();
    this.logger.log(`Updated vocabulary: ${updated.word}`);
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    const vocab = await this.findById(id);
    vocab.isDeleted = true;
    await this.vocabularyRepository.save(vocab);
    // await this.clearCaches();
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

    return await this.storageService.uploadFile(bucket, path, file);
  }

  // private async clearCaches(): Promise<void> {
  //   // cache-manager v7 with Redis: iterate known prefixes
  //   // In production consider using redis SCAN or tagged invalidation
  //   this.logger.log(
  //     'Vocabulary caches cleared (new writes invalidate via TTL)',
  //   );
  // }
}
