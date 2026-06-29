import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleQueryDto } from './dto/role-query.dto';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PermissionModule, PermissionAction } from '../common/constants/enums';

@ApiTags('Roles')
@ApiBearerAuth('access-token')
@UseGuards(AdminAuthGuard, RolesGuard)
@Controller('admin/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions({ module: PermissionModule.ROLE, action: PermissionAction.READ })
  @ApiOperation({ summary: 'List all active roles' })
  findAll(@Query() query: RoleQueryDto) {
    return this.rolesService.findAll(query);
  }

  @Get(':id')
  @Permissions({ module: PermissionModule.ROLE, action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get a role by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions({
    module: PermissionModule.ROLE,
    action: PermissionAction.CREATE,
  })
  @ApiOperation({ summary: 'Create a new role (Admin only)' })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Patch(':id')
  @Permissions({
    module: PermissionModule.ROLE,
    action: PermissionAction.UPDATE,
  })
  @ApiOperation({ summary: 'Update a role (Admin only)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    module: PermissionModule.ROLE,
    action: PermissionAction.DELETE,
  })
  @ApiOperation({ summary: 'Soft-delete a role (Admin only)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.rolesService.softDelete(id);
    return {
      message: 'Xóa quyền thành công',
    };
  }
}
