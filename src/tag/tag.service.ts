import {
  Injectable,
  Inject,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, Brackets } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import slugify from 'slugify';
import { Tag } from './entities/tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagType } from '../common/constants/enums';
import { TagQueryDto } from './dto/tag-query.dto';
import { CursorPaginatedResult } from '../common/types/pagination.type';

@Injectable()
export class TagService {
  private readonly logger = new Logger(TagService.name);
  private readonly CACHE_KEY_PREFIX = 'tags:list';

  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async getTags(queryDto: TagQueryDto): Promise<CursorPaginatedResult<Tag>> {
    // const cacheKey = type
    //   ? `${this.CACHE_KEY_PREFIX}:${type}`
    //   : this.CACHE_KEY_PREFIX;

    // const cachedTags = await this.cacheManager.get<Tag[]>(cacheKey);
    // if (cachedTags) {
    //   this.logger.debug(`Hit cache for key: ${cacheKey}`);
    //   return cachedTags;
    // }
    const { type, keyword, cursor, limit = 10 } = queryDto;
    const query = this.tagRepository.createQueryBuilder('tag');
    // Chỉ lấy những tag chưa bị xóa mềm
    query.where('tag.isDeleted = :isDeleted', { isDeleted: false });

    if (type) {
      query.andWhere('tag.type = :type', { type });
    }

    if (keyword) {
      const cleanKeyword = keyword.trim();
      // Chuyển keyword thành slug để tìm không dấu (VD: "Gia đình" -> "gia-dinh")
      const slugKeyword = slugify(cleanKeyword, {
        lower: true,
        strict: true,
        locale: 'vi',
      });

      query.andWhere(
        new Brackets((qbInner) => {
          qbInner
            .where('tag.name ILIKE :clean', { clean: `%${cleanKeyword}%` })
            .orWhere('tag.slug ILIKE :slug', { slug: `%${slugKeyword}%` });
        }),
      );
    }
    if (cursor) {
      const cursorItem = await this.tagRepository.findOne({
        where: { id: cursor },
        select: { createdAt: true },
      });
      if (cursorItem) {
        query.andWhere('tag.createdAt < :cursorDate', {
          cursorDate: cursorItem.createdAt,
        });
      }
    }
    const items = await query
      .orderBy('tag.createdAt', 'DESC')
      .take(limit + 1)
      .getMany();

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;
    // await this.cacheManager.set(cacheKey, tags, 3600);

    return {
      data,
      nextCursor,
      hasMore,
    };
  }

  async createTag(createTagDto: CreateTagDto): Promise<Tag> {
    const { name, type, colorCode, thumbnailUrl } = createTagDto;
    const slug = slugify(name, { lower: true, strict: true, locale: 'vi' });

    const isExist = await this.tagRepository.exists({ where: { slug } });
    if (isExist) {
      throw new ConflictException(
        `Tag với tên '${name}' hoặc slug '${slug}' đã tồn tại.`,
      );
    }

    const newTag = this.tagRepository.create({
      name,
      slug,
      type,
      colorCode,
      thumbnailUrl,
    });

    const savedTag = await this.tagRepository.save(newTag);
    // await this.clearTagCaches();

    return savedTag;
  }

  async updateTag(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    const tag = await this.tagRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!tag) {
      throw new NotFoundException(`Không tìm thấy Tag với ID: ${id}`);
    }

    const { name, type, colorCode, thumbnailUrl } = updateTagDto;
    let newSlug = tag.slug;

    if (name && name !== tag.name) {
      newSlug = slugify(name, { lower: true, strict: true, locale: 'vi' });

      // Check trùng slug nhưng PHẢI LOẠI TRỪ ID của chính Tag đang update ra
      const isExist = await this.tagRepository.exists({
        where: { slug: newSlug, id: Not(id) },
      });

      if (isExist) {
        throw new ConflictException(
          `Tag với tên '${name}' hoặc slug '${newSlug}' đã được sử dụng bởi một Tag khác.`,
        );
      }
    }

    // Nạp dữ liệu mới vào entity (Bỏ qua các trường undefined từ DTO)
    Object.assign(tag, {
      ...(name && { name }),
      ...(newSlug !== tag.slug && { slug: newSlug }),
      ...(type && { type }),
      ...(colorCode !== undefined && { colorCode }),
      ...(thumbnailUrl !== undefined && { thumbnailUrl }),
    });

    const updatedTag = await this.tagRepository.save(tag);
    // await this.clearTagCaches();

    return updatedTag;
  }

  async deleteTag(id: string): Promise<void> {
    const tag = await this.tagRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!tag) {
      throw new NotFoundException(`Không tìm thấy Tag với ID: ${id}`);
    }

    tag.isDeleted = true;
    await this.tagRepository.save(tag);
    // await this.clearTagCaches();
  }

  private async clearTagCaches(): Promise<void> {
    await this.cacheManager.del(this.CACHE_KEY_PREFIX);
    const deletePromises = Object.values(TagType).map((type) =>
      this.cacheManager.del(`${this.CACHE_KEY_PREFIX}:${type}`),
    );
    await Promise.all(deletePromises);
    this.logger.log('Tag caches invalidated');
  }
}
