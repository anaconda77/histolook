import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../archive/storage.service';
import type { UUID } from '../common/types/uuid.type';
import { GetProfileResponseDto } from './dto/get-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SecessionDto } from './dto/secession.dto';
import { AdminSecessionDto } from './dto/admin-secession.dto';

@Injectable()
export class MemberService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

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

    // 닉네임 검증
    if (dto.nickname !== undefined) {
      // 닉네임 길이 체크 (DTO 데코레이터에서도 검증하지만 추가 검증)
      if (dto.nickname.length < 2 || dto.nickname.length > 10) {
        throw new BadRequestException('닉네임 누락 혹은 유효 조건 위반');
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
    }

    // 관심 브랜드 검증
    if (dto.brandInterests !== undefined) {
      if (dto.brandInterests.length === 0) {
        throw new BadRequestException('관심 브랜드 누락 혹은 유효하지 않은 브랜드(혹은 개수 초과)');
      }
      if (dto.brandInterests.length > 3) {
        throw new BadRequestException('관심 브랜드 누락 혹은 유효하지 않은 브랜드(혹은 개수 초과)');
      }
    }

    // 변경된 필드만 업데이트
    const updateData: any = {};
    
    if (dto.nickname !== undefined) {
      updateData.nickname = dto.nickname;
    }
    
    // imageObjectName을 publicUrl로 변환 (보안: 백엔드에서만 변환)
    if (dto.imageObjectName !== undefined) {
      if (dto.imageObjectName === null || dto.imageObjectName === '') {
        // 기본 이미지로 변경 (null)
        updateData.imageUrl = null;
      } else {
        // objectName을 publicUrl로 변환
        updateData.imageUrl = this.storageService.getPublicUrlFromObjectName(dto.imageObjectName);
      }
    }
    
    if (dto.brandInterests !== undefined) {
      updateData.brandInterests = dto.brandInterests.join(',');
    }

    await this.prisma.member.update({
      where: { id: userId },
      data: updateData,
    });
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

    // DeviceToken 삭제 (회원 탈퇴 시 모든 디바이스 토큰 제거)
    await this.prisma.deviceToken.deleteMany({
      where: { memberId: userId },
    });

    // AuthUser 삭제 (재가입을 위해 즉시 삭제)
    if (member.authUserId) {
      await this.prisma.authUser.delete({
        where: { id: member.authUserId },
      });
    }

    // Member Soft delete 및 authUserId null 처리
    await this.prisma.member.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        secessionReason: dto.reason,
        authUserId: null, // AuthUser 삭제 후 null로 설정
      },
    });

    // 우리 서비스의 JWT 토큰은 클라이언트에서 삭제
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

    // DeviceToken 삭제 (관리자 삭제 시 모든 디바이스 토큰 제거)
    await this.prisma.deviceToken.deleteMany({
      where: { memberId: dto.memberId },
    });

    // AuthUser 삭제
    if (member.authUserId) {
      await this.prisma.authUser.delete({
        where: { id: member.authUserId },
      });
    }

    // Member Soft delete 및 authUserId null 처리
    await this.prisma.member.update({
      where: { id: dto.memberId },
      data: {
        deletedAt: new Date(),
        secessionReason: '관리자 삭제',
        authUserId: null, // AuthUser 삭제 후 null로 설정
      },
    });
  }
}
