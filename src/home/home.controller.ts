import {
  Controller,
  Get,
  Post,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { HomeService } from './home.service';
import { JwtUserAuthGuard } from '../common/guards/jwt-user-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/user-request.type';
import { ProgressService } from '../users/progress.service';
import { ProgressStatus } from '../common/constants/enums';

@ApiTags('Home')
@ApiBearerAuth('access-token')
@UseGuards(JwtUserAuthGuard)
@Controller('home')
export class HomeController {
  constructor(
    private readonly homeService: HomeService,
    private readonly progressService: ProgressService,
  ) {}

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get aggregated user dashboard (streak, stats, progress, quote of the day)',
  })
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    // JwtUserAuthGuard guarantees user is authenticated and user.id is always present.
    return this.homeService.getDashboard(user.id);
  }

  @Post('progress/learn')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update vocabulary progress' })
  learnWord(
    @CurrentUser() user: AuthenticatedUser,
    @Body('vocabularyId', ParseUUIDPipe) vocabularyId: string,
    @Body('status') status: ProgressStatus = ProgressStatus.MASTERED,
  ) {
    return this.progressService.learnWord(user.id, vocabularyId, status);
  }

  @Get('progress/mastered')
  @ApiOperation({ summary: 'Get list of mastered vocabulary IDs' })
  getMasteredWords(@CurrentUser() user: AuthenticatedUser) {
    return this.progressService.getMasteredVocabularyIds(user.id);
  }
}
