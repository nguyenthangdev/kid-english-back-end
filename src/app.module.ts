import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { QuotesModule } from './quotes/quotes.module';
import { VocabularyModule } from './vocabulary/vocabulary.module';
import { HomeModule } from './home/home.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [UsersModule, AuthModule, HomeModule, VocabularyModule, QuotesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
