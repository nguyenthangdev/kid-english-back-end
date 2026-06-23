import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserVocabularyProgress } from './entities/user-vocabulary-progress.entity';
import { UserStatistics } from './entities/user-statistics.entity';
import { ProgressStatus } from '../common/constants/enums';

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Idempotent UPSERT: mark a vocabulary as learned for a user.
   * Uses ON CONFLICT DO UPDATE to avoid duplicate entries.
   * If already MASTERED, status is not downgraded.
   */
  async learnWord(
    userId: string,
    vocabularyId: string,
    status: ProgressStatus = ProgressStatus.LEARNING,
  ): Promise<UserVocabularyProgress> {
    await this.dataSource.query(
      `
      INSERT INTO user_vocabulary_progress (id, user_id, vocabulary_id, status, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
      ON CONFLICT ON CONSTRAINT "UQ_USER_VOCABULARY"
      DO UPDATE SET
        status = CASE
          WHEN user_vocabulary_progress.status = 'MASTERED' THEN 'MASTERED'
          ELSE EXCLUDED.status
        END,
        updated_at = NOW()
      `,
      [userId, vocabularyId, status],
    );

    const result = await this.dataSource
      .getRepository(UserVocabularyProgress)
      .findOne({ where: { userId, vocabularyId } });

    this.logger.log(
      `Progress updated for user ${userId}, vocab ${vocabularyId} → ${result?.status}`,
    );

    return result!;
  }

  /**
   * Get total mastered vs total for a user (for dashboard ratio).
   */
  async getProgressStats(userId: string): Promise<{
    mastered: number;
    total: number;
    ratio: number;
  }> {
    const [{ mastered, total }] = await this.dataSource.query<
      [{ mastered: string; total: string }]
    >(
      `
      SELECT
        COUNT(*) FILTER (WHERE status = 'MASTERED') AS mastered,
        COUNT(*) AS total
      FROM user_vocabulary_progress
      WHERE user_id = $1
      `,
      [userId],
    );

    const masteredN = parseInt(mastered, 10);
    const totalN = parseInt(total, 10);
    return {
      mastered: masteredN,
      total: totalN,
      ratio: totalN > 0 ? Math.round((masteredN / totalN) * 100) : 0,
    };
  }
}
