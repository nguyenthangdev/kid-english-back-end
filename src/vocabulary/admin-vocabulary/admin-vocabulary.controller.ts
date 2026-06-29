import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import {
  PermissionModule,
  PermissionAction,
} from '../../common/constants/enums';
import { VocabularyService } from '../vocabulary.service';
import { CreateVocabularyDto } from '../dto/create-vocabulary.dto';
import { UpdateVocabularyDto } from '../dto/update-vocabulary.dto';
import { VocabularyQueryDto } from '../dto/vocabulary-query.dto';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { type UploadedImageFile } from '../../common/types/upload.type';

@ApiTags('Admin — Vocabularies')
@ApiBearerAuth('access-token')
@UseGuards(AdminAuthGuard, RolesGuard)
@Controller('admin/vocabularies')
export class AdminVocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Permissions({
    module: PermissionModule.VOCABULARY,
    action: PermissionAction.READ,
  })
  @ApiOperation({ summary: 'Get list of vocabularies (Cursor Pagination)' })
  findAll(@Query() query: VocabularyQueryDto) {
    return this.vocabularyService.listVocabularies(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions({
    module: PermissionModule.VOCABULARY,
    action: PermissionAction.CREATE,
  })
  @ApiOperation({ summary: 'Create a new vocabulary (Admin only)' })
  create(@Body() dto: CreateVocabularyDto) {
    return this.vocabularyService.create(dto);
  }

  @Patch(':id')
  @Permissions({
    module: PermissionModule.VOCABULARY,
    action: PermissionAction.UPDATE,
  })
  @ApiOperation({ summary: 'Update a vocabulary (Admin only)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVocabularyDto,
  ) {
    const result = await this.vocabularyService.update(id, dto);
    return {
      data: result,
      message: 'Cập nhật từ vựng thành công',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions({
    module: PermissionModule.VOCABULARY,
    action: PermissionAction.DELETE,
  })
  @ApiOperation({ summary: 'Soft-delete a vocabulary (Admin only)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.vocabularyService.softDelete(id);
    return {
      message: 'Xóa từ vựng thành công',
    };
  }

  @Post('upload-image')
  @HttpCode(HttpStatus.CREATED)
  @Permissions({
    module: PermissionModule.VOCABULARY,
    action: PermissionAction.CREATE,
  }) // or UPDATE
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Upload vocabulary image' })
  async uploadImage(@UploadedFile() file: UploadedImageFile) {
    const imageUrl = await this.vocabularyService.uploadImage(file);
    return {
      message: 'Tải ảnh thành công',
      data: { imageUrl },
    };
  }
}
