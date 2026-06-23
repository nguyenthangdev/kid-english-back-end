import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StreakDto {
  @ApiProperty() currentStreak: number;
  @ApiProperty() highestStreak: number;
  @ApiProperty() lastActiveDate: string | null;
}

export class StatisticsDto {
  @ApiProperty() totalStars: number;
  @ApiProperty() totalWordsLearned: number;
}

export class ProgressRatioDto {
  @ApiProperty() mastered: number;
  @ApiProperty() total: number;
  @ApiProperty() ratio: number;
}

export class QuoteOfDayDto {
  @ApiPropertyOptional() id?: string;
  @ApiPropertyOptional() contentEn?: string;
  @ApiPropertyOptional() contentVn?: string;
  @ApiPropertyOptional() author?: string;
}

export class DashboardResponseDto {
  @ApiProperty({ type: StreakDto }) streak: StreakDto;
  @ApiProperty({ type: StatisticsDto }) statistics: StatisticsDto;
  @ApiProperty({ type: ProgressRatioDto }) vocabularyProgress: ProgressRatioDto;
  @ApiPropertyOptional({ type: QuoteOfDayDto })
  quoteOfDay: QuoteOfDayDto | null;
}
