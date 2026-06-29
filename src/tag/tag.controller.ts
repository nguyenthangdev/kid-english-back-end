import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PermissionModule, PermissionAction } from '../common/constants/enums';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagType } from '../common/constants/enums';
import { TagQueryDto } from './dto/tag-query.dto';

@ApiTags('Tags')
@ApiBearerAuth('access-token')
@UseGuards(AdminAuthGuard, RolesGuard)
@Controller('admin/tags')
export class TagController {
  constructor(private readonly tagsService: TagService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions({ module: PermissionModule.TAG, action: PermissionAction.CREATE })
  @ApiOperation({ summary: 'Create a new tag (Admin only)' })
  createTag(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.createTag(createTagDto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions({ module: PermissionModule.TAG, action: PermissionAction.UPDATE })
  @ApiOperation({ summary: 'Update a tag (Admin only)' })
  async updateTag(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    const result = await this.tagsService.updateTag(id, updateTagDto);
    return {
      data: result,
      message: 'Cập nhật thẻ thành công',
    };
  }

  // @Get()
  // @HttpCode(HttpStatus.OK)
  // getTags(@Query('type') type?: TagType) {
  //   return this.tagsService.getTags(type);
  // }
  @Get()
  @HttpCode(HttpStatus.OK)
  @Permissions({ module: PermissionModule.TAG, action: PermissionAction.READ })
  @ApiOperation({ summary: 'Get tags with cursor pagination and search' })
  getTags(@Query() queryDto: TagQueryDto) {
    return this.tagsService.getTags(queryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions({ module: PermissionModule.TAG, action: PermissionAction.DELETE })
  async deleteTag(@Param('id', ParseUUIDPipe) id: string) {
    await this.tagsService.deleteTag(id);
    return {
      message: 'Xóa thẻ thành công',
    };
  }
}
