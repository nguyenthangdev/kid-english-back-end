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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagType } from '../common/constants/enums';
import { TagQueryDto } from './dto/tag-query.dto';

@ApiTags('Tags')
@Controller('admin/tags')
export class TagController {
  constructor(private readonly tagsService: TagService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new tag (Admin only)' })
  createTag(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.createTag(createTagDto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a tag (Admin only)' })
  updateTag(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    return this.tagsService.updateTag(id, updateTagDto);
  }

  // @Get()
  // @HttpCode(HttpStatus.OK)
  // getTags(@Query('type') type?: TagType) {
  //   return this.tagsService.getTags(type);
  // }
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get tags with cursor pagination and search' })
  getTags(@Query() queryDto: TagQueryDto) {
    return this.tagsService.getTags(queryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTag(@Param('id', ParseUUIDPipe) id: string) {
    return this.tagsService.deleteTag(id);
  }
}
