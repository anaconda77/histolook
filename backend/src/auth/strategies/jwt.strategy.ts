import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import type { UUID } from '../../common/types/uuid.type';

export interface JwtPayload {
  sub: UUID; // memberId
  authUserId: UUID;
  nickname: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'histolook-secret-key', // TODO: .env로 이동
    });
  }

  async validate(payload: JwtPayload) {
    // 토큰에 담긴 사용자 정보 검증
    const member = await this.prisma.member.findUnique({
      where: { id: payload.sub },
    });

    if (!member || member.deletedAt) {
      throw new UnauthorizedException('유효하지 않거나 만료된 토큰');
    }

    // 토큰의 nickname, role이 현재 DB와 일치하는지 확인 (선택적)
    // 불일치 시 재로그인 유도 가능
    if (member.nickname !== payload.nickname || member.role !== payload.role) {
      // 프로필이 변경된 경우: 경고 로그만 남기고 통과 (또는 에러 처리)
      console.warn(`Token payload mismatch for user ${member.id}`);
    }

    return {
      userId: member.id,
      authUserId: payload.authUserId,
      nickname: payload.nickname,
      role: payload.role,
    };
  }
}

