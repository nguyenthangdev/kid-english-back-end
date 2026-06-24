import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { AdminHomeService } from './admin-home.service';
import { AdminDashboardResponseDto } from './dto/admin-dashboard-response.dto';

/**
 * Admin-only dashboard controller.
 *
 * Requires cookie-based `accessToken` verified by AdminAuthGuard
 * (admin role check included inside the guard).
 *
 * All routes are prefixed: /home/admin
 */
@ApiTags('Admin - Home')
@ApiBearerAuth('access-token')
@UseGuards(AdminAuthGuard)
@Controller('home/admin')
export class AdminHomeController {
  constructor(private readonly adminHomeService: AdminHomeService) {}

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Admin aggregated dashboard',
    description:
      'Returns platform-wide KPIs: user counts, content counts, ' +
      'learning activity ratio, top 10 users, and latest 20 activity records. ' +
      'Response is cached for 60 seconds.',
  })
  @ApiOkResponse({
    description: 'Admin dashboard data',
    type: AdminDashboardResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Account does not have admin role' })
  getAdminDashboard(): Promise<AdminDashboardResponseDto> {
    return this.adminHomeService.getAdminDashboard();
  }
}
