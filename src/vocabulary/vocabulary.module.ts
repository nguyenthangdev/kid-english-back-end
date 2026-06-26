import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VocabularyService } from './vocabulary.service';
import { VocabularyController } from './vocabulary.controller';
import { AdminVocabularyController } from './admin-vocabulary/admin-vocabulary.controller';
import { Vocabulary } from './entities/vocabulary.entity';
import { StorageModule } from '../storage/storage.module';
import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [TypeOrmModule.forFeature([Vocabulary]), StorageModule, AuthModule],
  controllers: [VocabularyController, AdminVocabularyController],
  providers: [VocabularyService],
  exports: [VocabularyService],
})
export class VocabularyModule {}
