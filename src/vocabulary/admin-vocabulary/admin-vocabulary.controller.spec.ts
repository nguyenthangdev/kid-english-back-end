import { Test, TestingModule } from '@nestjs/testing';
import { AdminVocabularyController } from './admin-vocabulary.controller';

describe('AdminVocabularyController', () => {
  let controller: AdminVocabularyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminVocabularyController],
    }).compile();

    controller = module.get<AdminVocabularyController>(
      AdminVocabularyController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
