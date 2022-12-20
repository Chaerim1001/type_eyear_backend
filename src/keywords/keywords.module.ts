import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Keyword } from './entities/keyword.entity';
import { KeywordsService } from './keywords.service';

// keyword 작업에서 사용하는 테이블 및 service 정의
@Module({
  imports: [TypeOrmModule.forFeature([Keyword])],
  controllers: [],
  providers: [KeywordsService],
})
export class KeywordsModule {}
