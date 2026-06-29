import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { QueryUserDto } from './dto/query-user.dto';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PermissionModule, PermissionAction } from '../common/constants/enums';

@ApiTags('Admin - User Management')
@ApiBearerAuth('access-token')
@UseGuards(AdminAuthGuard, RolesGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions({ module: PermissionModule.USER, action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get all regular users (Admin panel)' })
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findRegularUsers(query);
  }

  @Patch(':id')
  @Permissions({ module: PermissionModule.USER, action: PermissionAction.UPDATE })
  @ApiOperation({ summary: 'Update a regular user (Admin panel)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: any,
  ) {
    return this.usersService.updateRegularUser(id, updateDto);
  }
}
