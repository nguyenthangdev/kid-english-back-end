import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtUserAuthGuard } from '../common/guards/jwt-user-auth.guard';
import { VocabularyService } from './vocabulary.service';
import { VocabularyQueryDto } from './dto/vocabulary-query.dto';
@ApiTags('Vocabularies')
@ApiBearerAuth('access-token')
@UseGuards(JwtUserAuthGuard)
@Controller('vocabularies')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List vocabularies with cursor-based pagination' })
  listVocabularies(@Query() query: VocabularyQueryDto) {
    return this.vocabularyService.listVocabularies(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single vocabulary by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vocabularyService.findById(id);
  }
}
