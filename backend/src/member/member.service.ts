import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UUID } from '../common/types/uuid.type';
import { ServiceTemporarilyUnavailableException } from '../common/exceptions/custom-exceptions';
import { GetProfileResponseDto } from './dto/get-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SecessionDto } from './dto/secession.dto';
import { AdminSecessionDto } from './dto/admin-secession.dto';

@Injectable()
export class MemberService {
  constructor(private prisma: PrismaService) {}

  /**
   * 7. 프로필 조회
   */
  async getProfile(userId: UUID): Promise<GetProfileResponseDto> {
    const member = await this.prisma.member.findUnique({
      where: { id: userId },
    });

    if (!member || member.deletedAt) {
      throw new NotFoundException('존재하지 않는 사용자');
    }

    return {
      nickname: member.nickname,
      role: member.role,
      imageUrl: member.imageUrl,
      brandInterests: member.brandInterests.split(',').filter(b => b.length > 0),
    };
  }

  /**
   * 8. 프로필 수정
   */
  async updateProfile(
    userId: UUID,
    dto: UpdateProfileDto,
  ): Promise<void> {
    const member = await this.prisma.member.findUnique({
      where: { id: userId },
    });

    if (!member || member.deletedAt) {
      throw new NotFoundException('존재하지 않는 사용자');
    }

    // 닉네임이 변경되는 경우 중복 체크
    if (dto.nickname !== member.nickname) {
      const existing = await this.prisma.member.findUnique({
        where: { nickname: dto.nickname },
      });

      if (existing) {
        throw new ForbiddenException('이미 사용 중인 닉네임');
      }
    }

    try {
      await this.prisma.member.update({
        where: { id: userId },
        data: {
          nickname: dto.nickname,
          role: dto.role,
          imageUrl: dto.imageUrl || member.imageUrl,
          brandInterests: dto.brandInterests.join(','),
        },
      });
    } catch (error) {
      throw new ServiceTemporarilyUnavailableException(
        '일시적 오류로 프로필 수정 실패(재시도 요청)',
      );
    }
  }

  /**
   * 9. 회원 탈퇴
   */
  async secession(userId: UUID, dto: SecessionDto): Promise<void> {
    const member = await this.prisma.member.findUnique({
      where: { id: userId },
    });

    if (!member || member.deletedAt) {
      throw new NotFoundException('존재하지 않는 사용자');
    }

    try {
      // Soft delete
      await this.prisma.member.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          secessionReason: dto.reason,
        },
      });

      // OAuth2 소셜 로그인 토큰 무효화
      await this.prisma.authUser.update({
        where: { id: member.authUserId },
        data: {
          accessToken: null,
          refreshToken: null,
        },
      });

      // 우리 서비스의 JWT 토큰은 클라이언트에서 삭제
    } catch (error) {
      throw new ServiceTemporarilyUnavailableException(
        '일시적 오류로 회원 탈퇴 실패(재시도 요청)',
      );
    }
  }

  /**
   * 10. 관리자 삭제
   */
  async secessionAdmin(dto: AdminSecessionDto): Promise<void> {
    // 관리자 존재 여부 확인 (memberId와 nickname 모두 일치)
    const member = await this.prisma.member.findUnique({
      where: { 
        id: dto.memberId,
      },
    });

    if (!member || member.deletedAt || member.nickname !== dto.nickname) {
      throw new NotFoundException('존재하지 않는 관리자');
    }

    // 관리자가 아닌 경우
    if (member.role !== 'ADMIN') {
      throw new NotFoundException('존재하지 않는 관리자');
    }

    try {
      // Soft delete
      await this.prisma.member.update({
        where: { id: dto.memberId },
        data: {
          deletedAt: new Date(),
          secessionReason: '관리자 삭제',
        },
      });

      // AuthUser도 삭제
      await this.prisma.authUser.delete({
        where: { id: member.authUserId },
      });
    } catch (error) {
      throw new ServiceTemporarilyUnavailableException(
        '일시적 오류로 관리자 삭제 실패(재시도 요청)',
      );
    }
  }
}
