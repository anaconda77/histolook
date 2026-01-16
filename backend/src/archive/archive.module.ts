import { Module } from '@nestjs/common';
import { ArchiveController } from './archive.controller';
import { ArchiveService } from './archive.service';
import { StorageService } from './storage.service';

@Module({
  controllers: [ArchiveController],
  providers: [ArchiveService, StorageService],
  exports: [ArchiveService, StorageService], // StorageService를 export하여 MemberModule에서 사용 가능
})
export class ArchiveModule {}

