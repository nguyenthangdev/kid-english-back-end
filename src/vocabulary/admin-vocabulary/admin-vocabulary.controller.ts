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
import { VocabularyService } from '../vocabulary.service';
import { CreateVocabularyDto } from '../dto/create-vocabulary.dto';
import { UpdateVocabularyDto } from '../dto/update-vocabulary.dto';
import { VocabularyQueryDto } from '../dto/vocabulary-query.dto';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { type UploadedImageFile } from '../../common/types/upload.type';

@ApiTags('Admin — Vocabularies')
@ApiBearerAuth('access-token')
@UseGuards(AdminAuthGuard)
@Controller('admin/vocabularies')
export class AdminVocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get list of vocabularies (Cursor Pagination)' })
  findAll(@Query() query: VocabularyQueryDto) {
    return this.vocabularyService.listVocabularies(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new vocabulary (Admin only)' })
  create(@Body() dto: CreateVocabularyDto) {
    return this.vocabularyService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a vocabulary (Admin only)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVocabularyDto,
  ) {
    return this.vocabularyService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a vocabulary (Admin only)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.vocabularyService.softDelete(id);
  }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Upload vocabulary image' })
  uploadImage(@UploadedFile() file: UploadedImageFile) {
    const imageUrl = this.vocabularyService.uploadImage(file);
    return {
      statusCode: 200,
      message: 'Tải ảnh thành công',
      data: { imageUrl },
    };
  }
}
