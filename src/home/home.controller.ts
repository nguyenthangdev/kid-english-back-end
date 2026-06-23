import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { HomeService } from './home.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
interface AuthUser {
  id: string;
}
@ApiTags('Home')
@ApiBearerAuth('access-token')
@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) { }

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get aggregated user dashboard (streak, stats, progress, quote of the day)',
  })
  getDashboard(@CurrentUser() user: AuthUser) {
    return this.homeService.getDashboard(user.id ?? '');
  }
}
