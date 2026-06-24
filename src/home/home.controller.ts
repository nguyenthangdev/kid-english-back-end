import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { HomeService } from './home.service';
import { JwtUserAuthGuard } from '../common/guards/jwt-user-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/user-request.type';

@ApiTags('Home')
@ApiBearerAuth('access-token')
@UseGuards(JwtUserAuthGuard)
@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

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
}
