import { Module } from '@nestjs/common';
import { VocabularyService } from './vocabulary.service';
import { VocabularyController } from './vocabulary.controller';
import { AdminVocabularyController } from './admin-vocabulary/admin-vocabulary.controller';

@Module({
  controllers: [VocabularyController, AdminVocabularyController],
  providers: [VocabularyService],
})
export class VocabularyModule {}
