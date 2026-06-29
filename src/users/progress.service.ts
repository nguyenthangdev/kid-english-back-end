import {
  Injectable,
  Inject,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { DataSource } from 'typeorm';
import { UserVocabularyProgress } from './entities/user-vocabulary-progress.entity';
import { UserStatistics } from './entities/user-statistics.entity';
import {
  ProgressStatus,
  ActiveType,
  TargetType,
} from '../common/constants/enums';
import { Vocabulary } from '../vocabulary/entities/vocabulary.entity';
import { GamificationService } from './gamification.service';

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly gamificationService: GamificationService,
  ) {}

  /**
   * Cập nhật tiến độ học từ vựng của User.
   * Sử dụng Transaction để đảm bảo tính toàn vẹn dữ liệu:
   * Nếu user thuộc từ mới -> tự động +1 vào bảng user_statistics.
   */
  async learnWord(
    userId: string,
    vocabularyId: string,
    status: ProgressStatus = ProgressStatus.LEARNING,
  ): Promise<UserVocabularyProgress> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Tìm bản ghi progress hiện tại
      // trong trường hợp user spam click nút "Đã thuộc" liên tục)
      let progress = await queryRunner.manager.findOne(UserVocabularyProgress, {
        where: { userId, vocabularyId },
        lock: { mode: 'pessimistic_write' },
      });

      let isNewlyMastered = false;

      if (!progress) {
        // Chưa từng tương tác -> Tạo mới hoàn toàn
        progress = queryRunner.manager.create(UserVocabularyProgress, {
          userId,
          vocabularyId,
          status,
        });

        // Nếu vừa tạo mới mà đã đánh dấu là MASTERED luôn
        if (status === ProgressStatus.MASTERED) {
          isNewlyMastered = true;
        }
      } else {
        // Đã từng học -> Chỉ update nếu trạng thái thay đổi từ LEARNING sang MASTERED.
        // Cố tình bỏ qua nếu update từ MASTERED xuống LEARNING (Idempotent: không giáng cấp).
        if (
          progress.status === ProgressStatus.LEARNING &&
          status === ProgressStatus.MASTERED
        ) {
          progress.status = ProgressStatus.MASTERED;
          isNewlyMastered = true;
        }
      }

      // Lưu cập nhật tiến độ chi tiết
      await queryRunner.manager.save(UserVocabularyProgress, progress);

      // 2. Đồng bộ Cache: Chỉ khi CÓ THÊM 1 TỪ ĐƯỢC MASTERED thì mới cộng dồn vào thống kê
      if (isNewlyMastered) {
        await queryRunner.manager.query(
          `
          INSERT INTO user_statistics (user_id, total_stars, total_words_learned, created_at, updated_at)
          VALUES ($1, 0, 1, NOW(), NOW())
          ON CONFLICT (user_id) DO UPDATE
          SET total_words_learned = user_statistics.total_words_learned + 1,
              updated_at = NOW()
          `,
          [userId],
        );
      }

      await queryRunner.commitTransaction();

      // Kích hoạt tính năng Gamification (tính Streak và cộng Sao)
      await this.gamificationService
        .recordActivity(
          userId,
          ActiveType.LEARN_FLASHCARD,
          TargetType.VOCABULARY,
          vocabularyId,
        )
        .catch((e) =>
          this.logger.error('Failed to record gamification activity', e),
        );

      // 3. Clear dashboard cache so it updates immediately
      await this.cacheManager.del(`dashboard:${userId}`);

      this.logger.log(
        `Progress updated for user ${userId}, vocab ${vocabularyId} → ${progress.status}`,
      );

      return progress;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to learn word for user ${userId}`, error);
      throw new InternalServerErrorException(
        'Failed to update vocabulary progress',
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Lấy thống kê Dashboard nhanh chóng
   */
  async getProgressStats(userId: string): Promise<{
    mastered: number;
    total: number;
    ratio: number;
  }> {
    // Đếm số từ ĐÃ THUỘC THỰC TẾ và CHƯA BỊ XÓA (chính xác 100%)
    const realMastered = await this.dataSource
      .getRepository(UserVocabularyProgress)
      .createQueryBuilder('uvp')
      .innerJoin('uvp.vocabulary', 'vocab')
      .where('uvp.user_id = :userId', { userId })
      .andWhere('uvp.status = :status', { status: ProgressStatus.MASTERED })
      .andWhere('vocab.is_deleted = false')
      .getCount();

    // Tự động sửa lỗi sai lệch dữ liệu trong bảng user_statistics
    await this.dataSource.query(
      'UPDATE user_statistics SET total_words_learned = $1 WHERE user_id = $2',
      [realMastered, userId]
    );

    // Đếm tổng số từ vựng hiện có trong hệ thống
    const total = await this.dataSource
      .getRepository(Vocabulary)
      .count({ where: { isDeleted: false } });

    return {
      mastered: realMastered,
      total,
      ratio: total > 0 ? Math.round((realMastered / total) * 100) : 0,
    };
  }

  /**
   * Get all mastered vocabulary IDs for a user
   */
  async getMasteredVocabularyIds(userId: string): Promise<string[]> {
    const records = await this.dataSource
      .getRepository(UserVocabularyProgress)
      .find({
        where: { userId, status: ProgressStatus.MASTERED },
        select: { vocabularyId: true },
      });
    return records.map((r) => r.vocabularyId);
  }
}
