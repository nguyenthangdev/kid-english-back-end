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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { VocabularyService } from '../vocabulary.service';
import { CreateVocabularyDto } from '../dto/create-vocabulary.dto';
import { UpdateVocabularyDto } from '../dto/update-vocabulary.dto';

@ApiTags('Admin — Vocabularies')
@ApiBearerAuth('access-token')
@Controller('admin/vocabularies')
export class AdminVocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

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
}
