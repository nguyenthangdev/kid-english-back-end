import { ApiProperty } from '@nestjs/swagger';

// ─── Platform Overview ────────────────────────────────────────────────────────

export class PlatformOverviewDto {
  @ApiProperty({ description: 'Total registered users (non-deleted)' })
  totalUsers: number;

  @ApiProperty({ description: 'Active users (is_active = true)' })
  activeUsers: number;

  @ApiProperty({ description: 'Total vocabulary items (non-deleted)' })
  totalVocabularies: number;

  @ApiProperty({ description: 'Total quotes (non-deleted)' })
  totalQuotes: number;

  @ApiProperty({ description: 'Total topic tags' })
  totalTags: number;
}

// ─── Learning Activity ────────────────────────────────────────────────────────

export class LearningActivityDto {
  @ApiProperty({ description: 'Total vocabulary progress records (all users)' })
  totalProgressRecords: number;

  @ApiProperty({ description: 'Total mastered vocabulary records' })
  masteredRecords: number;

  @ApiProperty({ description: 'Overall mastery ratio (0-1)' })
  masteryRatio: number;
}

// ─── Top Active Users ─────────────────────────────────────────────────────────

export class TopUserDto {
  @ApiProperty() userId: string;
  @ApiProperty() fullName: string;
  @ApiProperty() email: string;
  @ApiProperty({ description: 'Total stars earned' })
  totalStars: number;
  @ApiProperty({ description: 'Total words learned' })
  totalWordsLearned: number;
  @ApiProperty({ description: 'Current login streak (days)' })
  currentStreak: number;
}

// ─── Recent Activity Feed ─────────────────────────────────────────────────────

export class RecentActivityDto {
  @ApiProperty() activityId: string;
  @ApiProperty() userId: string;
  @ApiProperty() userFullName: string;
  @ApiProperty({ description: 'ActiveType enum value' })
  activeType: string;
  @ApiProperty({ description: 'TargetType enum value' })
  targetType: string;
  @ApiProperty({ nullable: true }) targetId: string | null;
  @ApiProperty({ description: 'ISO timestamp' }) occurredAt: string;
}

// ─── Root Response ────────────────────────────────────────────────────────────

export class AdminDashboardResponseDto {
  @ApiProperty({ type: PlatformOverviewDto })
  overview: PlatformOverviewDto;

  @ApiProperty({ type: LearningActivityDto })
  learningActivity: LearningActivityDto;

  // @ApiProperty({ type: [TopUserDto], description: 'Top 10 users by stars' })
  // topUsers: TopUserDto[];

  // @ApiProperty({
  //   type: [RecentActivityDto],
  //   description: 'Latest 20 activity records',
  // })
  // recentActivities: RecentActivityDto[];

  @ApiProperty({ description: 'Cache TTL remaining (ms) — informational' })
  cachedAt: string;
}
