import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { SaveMatrixDto } from './dto/save-matrix.dto';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PermissionModule, PermissionAction } from '../common/constants/enums';

@ApiTags('Permissions')
@ApiBearerAuth('access-token')
@UseGuards(AdminAuthGuard, RolesGuard)
@Controller('admin/permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Permissions({ module: PermissionModule.PERMISSION, action: PermissionAction.READ })
  @ApiOperation({ summary: 'List all permissions' })
  findAll() {
    return this.permissionsService.findAll();
  }

  @Post('matrix')
  @Permissions({ module: PermissionModule.PERMISSION, action: PermissionAction.UPDATE })
  @ApiOperation({ summary: 'Save permission matrix' })
  saveMatrix(@Body() dto: SaveMatrixDto) {
    return this.permissionsService.saveMatrix(dto.matrix);
  }
}
