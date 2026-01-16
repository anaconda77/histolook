import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UUID } from '../common/types/uuid.type';
import { ServiceTemporarilyUnavailableException } from '../common/exceptions/custom-exceptions';
import {
  CreateSupportDto,
  CreateSupportResponseDto,
} from './dto/create-support.dto';
import {
  GetSupportsResponseDto,
  SupportItemDto,
} from './dto/get-supports.dto';
import {
  GetSupportDetailResponseDto,
  SupportDetailDto,
} from './dto/get-support-detail.dto';
import {
  AdminGetSupportsQueryDto,
  AdminGetSupportsResponseDto,
  AdminSupportItemDto,
} from './dto/admin-get-supports.dto';
import { AdminReplySupportDto } from './dto/admin-reply-support.dto';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  /**
   * 1. 문의글 등록
   */
  async createSupport(
    userId: UUID,
    dto: CreateSupportDto,
  ): Promise<CreateSupportResponseDto> {
    try {
      const support = await this.prisma.supportPost.create({
        data: {
          title: dto.title,
          supportType: dto.supportType,
          content: dto.content,
          memberId: userId,
        },
      });

      return {
        supportPostId: support.id.toString(),
        memberId: support.memberId,
        title: support.title,
        supportType: support.supportType,
      };
    } catch (error) {
      throw new ServiceTemporarilyUnavailableException(
        '일시적 오류로 문의글 등록 실패(재시도 요청)',
      );
    }
  }

  /**
   * 2. 문의글 리스트 조회
   */
  async getSupports(userId: UUID): Promise<GetSupportsResponseDto> {
    try {
      const supports = await this.prisma.supportPost.findMany({
        where: {
          memberId: userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const supportItems: SupportItemDto[] = supports.map((support) => ({
        supportPostId: support.id.toString(),
        supportType: support.supportType,
        title: support.title,
        status: support.status,
      }));

      return { supports: supportItems };
    } catch (error) {
      throw new ServiceTemporarilyUnavailableException(
        '일시적 오류로 문의글 리스트 조회 실패(재시도 요청)',
      );
    }
  }

  /**
   * 3. 문의글 상세 조회
   */
  async getSupportDetail(
    userId: UUID,
    supportPostId: string,
  ): Promise<GetSupportDetailResponseDto> {
    try {
      const supportPostIdBigInt = BigInt(supportPostId);

      const support = await this.prisma.supportPost.findUnique({
        where: {
          id: supportPostIdBigInt,
        },
      });

      if (!support) {
        throw new NotFoundException('존재하지 않는 문의글');
      }

      // 본인의 문의글인지 확인
      if (support.memberId !== userId) {
        throw new NotFoundException('존재하지 않는 문의글');
      }

      const supportDetail: SupportDetailDto = {
        supportPostId: support.id.toString(),
        title: support.title,
        supportType: support.supportType,
        content: support.content,
        status: support.status,
        createdAt: support.createdAt.toISOString(),
        reply: support.reply,
      };

      return { supports: [supportDetail] };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ServiceTemporarilyUnavailableException(
        '일시적 오류로 문의글 리스트 조회 실패(재시도 요청)',
      );
    }
  }

  /**
   * 4. [관리자] 전체 문의글 조회 (페이지네이션)
   */
  async adminGetAllSupports(
    query: AdminGetSupportsQueryDto,
  ): Promise<AdminGetSupportsResponseDto> {
    try {
      const page = query.page || 1;
      const pageSize = 20;
      const skip = (page - 1) * pageSize;

      const supports = await this.prisma.supportPost.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      });

      const supportItems: AdminSupportItemDto[] = supports.map((support) => ({
        supportPostId: support.id.toString(),
        memberId: support.memberId,
        supportType: support.supportType,
        title: support.title,
        reply: support.reply,
        status: support.status,
        publishedAt: this.getRelativeTime(support.createdAt),
      }));

      return {
        page,
        size: pageSize,
        supports: supportItems,
      };
    } catch (error) {
      throw new ServiceTemporarilyUnavailableException(
        '일시적 오류로 문의글 리스트 조회 실패(재시도 요청)',
      );
    }
  }

  /**
   * 5. [관리자] 문의글 답변 등록
   */
  async adminReplySupport(
    supportPostId: string,
    dto: AdminReplySupportDto,
  ): Promise<void> {
    try {
      const supportPostIdBigInt = BigInt(supportPostId);

      const support = await this.prisma.supportPost.findUnique({
        where: { id: supportPostIdBigInt },
      });

      if (!support) {
        throw new NotFoundException('존재하지 않는 문의글');
      }

      await this.prisma.supportPost.update({
        where: { id: supportPostIdBigInt },
        data: {
          reply: dto.reply,
          status: '답변 완료',
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ServiceTemporarilyUnavailableException(
        '일시적 오류로 답변 등록 실패(재시도 요청)',
      );
    }
  }

  /**
   * 6. [관리자] 문의글 삭제
   */
  async adminDeleteSupport(supportPostId: string): Promise<void> {
    try {
      const supportPostIdBigInt = BigInt(supportPostId);

      const support = await this.prisma.supportPost.findUnique({
        where: { id: supportPostIdBigInt },
      });

      if (!support) {
        throw new NotFoundException('존재하지 않는 문의글');
      }

      await this.prisma.supportPost.delete({
        where: { id: supportPostIdBigInt },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ServiceTemporarilyUnavailableException(
        '일시적 오류로 문의글 삭제 실패(재시도 요청)',
      );
    }
  }

  /**
   * 상대 시간 계산 헬퍼 함수
   * 예: "방금 전", "1분 전", "1시간 전", "1일 전"
   */
  private getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) {
      return '방금 전';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else if (diffDays < 30) {
      return `${diffDays}일 전`;
    } else if (diffMonths < 12) {
      return `${diffMonths}개월 전`;
    } else {
      return `${diffYears}년 전`;
    }
  }
}

