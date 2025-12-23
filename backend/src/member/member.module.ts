import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OptionalAdminGuard } from './guards/optional-admin-guard';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [MemberController],
  providers: [MemberService, OptionalAdminGuard],
  exports: [MemberService],
})
export class MemberModule {}
