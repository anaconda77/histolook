import { Module } from '@nestjs/common';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ArchiveModule } from '../archive/archive.module';

@Module({
  imports: [
    PrismaModule,
    ArchiveModule, // StorageService를 사용하기 위해 추가
  ],
  controllers: [MemberController],
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberModule {}
