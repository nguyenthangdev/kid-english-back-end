import { Test, TestingModule } from '@nestjs/testing';
import { AdminQuoteController } from './admin-quote.controller';

describe('AdminQuoteController', () => {
  let controller: AdminQuoteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminQuoteController],
    }).compile();

    controller = module.get<AdminQuoteController>(AdminQuoteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
