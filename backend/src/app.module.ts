import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ArchiveModule } from './archive/archive.module';
import { AuthModule } from './auth/auth.module';
import { MemberModule } from './member/member.module';
import { AlarmModule } from './alarm/alarm.module';
import { SupportModule } from './support/support.module';

@Module({
  imports: [
    PrismaModule,
    ArchiveModule,
    AuthModule,
    MemberModule,
    AlarmModule,
    SupportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
