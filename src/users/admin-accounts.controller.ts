import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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

@ApiTags('Admin Accounts')
@ApiBearerAuth('access-token')
@UseGuards(AdminAuthGuard, RolesGuard)
@Controller('admin/administrators')
export class AdminAccountsController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @Permissions({ module: PermissionModule.USER, action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get all admin accounts' })
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAdministrators(query);
  }

  @Post()
  @Permissions({ module: PermissionModule.USER, action: PermissionAction.CREATE })
  @ApiOperation({ summary: 'Create a new admin account' })
  create(@Body() createDto: any) {
    return this.usersService.createAdmin(createDto);
  }

  @Patch(':id')
  @Permissions({ module: PermissionModule.USER, action: PermissionAction.UPDATE })
  @ApiOperation({ summary: 'Update an admin account' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: any,
  ) {
    return this.usersService.updateAdmin(id, updateDto);
  }

  @Delete(':id')
  @Permissions({ module: PermissionModule.USER, action: PermissionAction.DELETE })
  @ApiOperation({ summary: 'Soft-delete an admin account' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.softDelete(id);
  }
}
