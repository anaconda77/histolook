import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * mode=admin이면 인증을 건너뛰고, 그렇지 않으면 JWT 인증 수행
 */
@Injectable()
export class OptionalAdminGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const mode = request.query.mode;

    // 관리자 모드면 인증 건너뛰기
    if (mode === 'admin') {
      return true;
    }

    // 일반 회원 탈퇴 - JWT 인증 필요
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('액세스 토큰 누락');
    }

    const token = authHeader.substring(7);

    try {
      const payload = this.jwtService.verify(token);
      
      // Member 조회
      const member = await this.prisma.member.findUnique({
        where: { id: payload.sub },
      });

      if (!member || member.deletedAt) {
        throw new UnauthorizedException('유효하지 않거나 만료된 토큰');
      }

      // request에 user 정보 추가 (JWT payload에서 가져오기)
      request.user = {
        userId: member.id,
        authUserId: payload.authUserId,
        nickname: payload.nickname,
        role: payload.role,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('유효하지 않거나 만료된 토큰');
    }
  }
}

