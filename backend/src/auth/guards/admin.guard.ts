import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 관리자 권한 체크 Guard
 * JWT 인증 후 사용자의 role이 'ADMIN'인지 확인
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      throw new ForbiddenException('접근 권한 없음(관리자가 아님)');
    }

    // DB에서 사용자의 role 확인
    const member = await this.prisma.member.findUnique({
      where: { id: user.userId },
      select: { role: true, deletedAt: true },
    });

    if (!member || member.deletedAt || member.role !== 'ADMIN') {
      throw new ForbiddenException('접근 권한 없음(관리자가 아님)');
    }

    return true;
  }
}

