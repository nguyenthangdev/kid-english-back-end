import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VocabularyService } from './vocabulary.service';
import { VocabularyController } from './vocabulary.controller';
import { AdminVocabularyController } from './admin-vocabulary/admin-vocabulary.controller';
import { Vocabulary } from './entities/vocabulary.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Vocabulary])],
  controllers: [VocabularyController, AdminVocabularyController],
  providers: [VocabularyService],
  exports: [VocabularyService],
})
export class VocabularyModule {}
