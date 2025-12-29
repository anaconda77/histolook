import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  InvalidFilterException,
  ServiceTemporarilyUnavailableException 
} from '../common/exceptions/custom-exceptions';
import { UUID } from '../common/types/uuid.type';
import {
  GetArchivesQueryDto,
  GetArchivesResponseDto,
  ArchiveItemDto,
} from './dto/get-archives.dto';
import { GetArchiveDetailResponseDto } from './dto/get-archive-detail.dto';
import {
  GetMyArchivesQueryDto,
  GetMyArchivesResponseDto,
  MyArchiveItemDto,
} from './dto/get-my-archives.dto';
import {
  CreateArchiveDto,
  CreateArchiveResponseDto,
} from './dto/create-archive.dto';
import { UpdateArchiveDto } from './dto/update-archive.dto';
import {
  CreateJudgementDto,
  CreateJudgementResponseDto,
} from './dto/create-judgement.dto';
import {
  GetCommentsQueryDto,
  GetCommentsResponseDto,
  CommentItemDto,
} from './dto/get-comments.dto';
import {
  GetInterestArchivesQueryDto,
  GetInterestArchivesResponseDto,
  InterestArchiveItemDto,
} from './dto/get-interest-archives.dto';
import { CreateInterestArchiveResponseDto } from './dto/create-interest-archive.dto';
import { TimeUtil } from '../common/utils/time.util';
import {
  GetFilteringQueryDto,
  GetBrandsResponseDto,
  GetTimelinesResponseDto,
  GetCategoriesResponseDto,
  FilterItemDto,
} from './dto/get-filters.dto';

@Injectable()
export class ArchiveService {
  private readonly PAGE_SIZE = 20;

  constructor(private prisma: PrismaService) {}

  async getArchives(
    query: GetArchivesQueryDto,
    userId?: UUID,
  ): Promise<GetArchivesResponseDto> {
    const { page = 1, brand, timeline, category } = query;
    const skip = (page - 1) * this.PAGE_SIZE;

    try {
      // 필터 조건 구성
      const where: any = { deletedAt: null };
      
      if (brand) {
        // 브랜드 존재 여부 확인
        const brandExists = await this.prisma.brand.findFirst({
          where: { name: brand },
        });
        if (!brandExists) {
          throw new InvalidFilterException();
        }
        where.brand = { name: brand };
      }
      if (timeline) {
        // 타임라인 존재 여부 확인
        const timelineExists = await this.prisma.timeline.findFirst({
          where: { name: timeline },
        });
        if (!timelineExists) {
          throw new InvalidFilterException();
        }
        where.timeline = { name: timeline };
      }
      if (category) {
        // 카테고리 존재 여부 확인
        const categoryExists = await this.prisma.category.findFirst({
          where: { name: category },
        });
        if (!categoryExists) {
          throw new InvalidFilterException();
        }
        where.category = { name: category };
      }

      // 아카이브 조회
      const archives = await this.prisma.archive.findMany({
        where,
        skip,
        take: this.PAGE_SIZE + 1,
        orderBy: { createdAt: 'desc' },
        include: {
          brand: true,
          timeline: true,
          category: true,
        },
      });

      const hasNext = archives.length > this.PAGE_SIZE;
      const items = archives.slice(0, this.PAGE_SIZE);

      // 관심 아카이브 확인 (회원인 경우)
      let interestArchiveIds: Set<string> = new Set();
      if (userId) {
        const interests = await this.prisma.archiveInterest.findMany({
          where: {
            memberId: userId,
            deletedAt: null,
            archiveId: { in: items.map((a) => a.id) },
          },
          select: { archiveId: true },
        });
        interestArchiveIds = new Set(interests.map((i) => i.archiveId));
      }

      // 응답 데이터 구성
      const archiveItems: ArchiveItemDto[] = items.map((archive) => ({
        archiveId: archive.id,
        imageUrls: archive.imageUrls,
        isInterest: interestArchiveIds.has(archive.id),
      }));

      return {
        brand: brand || undefined,
        timeline: timeline || undefined,
        category: category || undefined,
        page,
        hasNext,
        archives: archiveItems,
      };
    } catch (error) {
      if (error instanceof InvalidFilterException) {
        throw error;
      }
      throw new ServiceTemporarilyUnavailableException(
        '일시적 오류로 아카이브 목록 조회 실패(재시도 요청)',
      );
    }
  }

  async getArchiveDetail(
    archiveId: UUID,
    userId?: UUID,
  ): Promise<GetArchiveDetailResponseDto> {
    const archive = await this.prisma.archive.findUnique({
      where: { id: archiveId },
      include: {
        brand: true,
        timeline: true,
        category: true,
        author: true,
      },
    });

    if (!archive || archive.deletedAt) {
      throw new NotFoundException('존재하지 않는 아카이브 id');
    }

    // 내 판정 정보 조회
    let myJudgement: { isArchive: boolean; price?: number } | null = null;
    let isJudged = false;
    if (userId) {
      const judgement = await this.prisma.judgement.findFirst({
        where: {
          archiveId,
          memberId: userId,
        },
      });

      if (judgement) {
        isJudged = true;
        myJudgement = {
          isArchive: judgement.isArchive,
          price: judgement.price ? Number(judgement.price) : undefined,
        };
      }
    }

    // 대표 코멘트 조회
    const archivedComment = await this.prisma.judgement.findFirst({
      where: {
        archiveId,
        isArchive: true,
        comment: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });

    const deArchivedComment = await this.prisma.judgement.findFirst({
      where: {
        archiveId,
        isArchive: false,
        comment: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });

    const comments =
      archivedComment || deArchivedComment
        ? {
            archivedOne: archivedComment?.comment ?? undefined,
            deArchivedOne: deArchivedComment?.comment ?? undefined,
          }
        : undefined;

    return {
      archiveId: archive.id,
      brand: archive.brand.name,
      timeline: archive.timeline.name,
      category: archive.category.name,
      averagePrice: archive.averageJudgementPrice
        ? Number(archive.averageJudgementPrice)
        : undefined,
      story: archive.story,
      imageUrls: archive.imageUrls,
      authorId: archive.authorId,
      authorImageUrl: archive.author.imageUrl ?? undefined,
      authorNickname: archive.author.nickname,
      isJudged,
      myJudgement,
      comments,
      publishedAt: TimeUtil.getRelativeTime(archive.createdAt),
    };
  }

  async getMyArchives(
    userId: UUID,
    query: GetMyArchivesQueryDto,
  ): Promise<GetMyArchivesResponseDto> {
    const { page = 1 } = query;
    const skip = (page - 1) * this.PAGE_SIZE;

    const archives = await this.prisma.archive.findMany({
      where: {
        authorId: userId,
        deletedAt: null,
      },
      skip,
      take: this.PAGE_SIZE + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        brand: true,
        timeline: true,
        category: true,
      },
    });

    const hasNext = archives.length > this.PAGE_SIZE;
    const items = archives.slice(0, this.PAGE_SIZE);

    const archiveItems: MyArchiveItemDto[] = items.map((archive) => ({
      archiveId: archive.id,
      imageUrls: archive.imageUrls,
      brand: archive.brand.name,
      timeline: archive.timeline.name,
      category: archive.category.name,
      story: archive.story,
      publishedAt: TimeUtil.getRelativeTime(archive.createdAt),
    }));

    return {
      page,
      hasNext,
      archives: archiveItems,
    };
  }

  async createArchive(
    userId: UUID,
    dto: CreateArchiveDto,
  ): Promise<CreateArchiveResponseDto> {
    try {
      // 브랜드, 타임라인, 카테고리 조회
      const brand = await this.findBrand(dto.brand);
      const timeline = await this.findTimeline(dto.timeline);
      const category = await this.findCategory(dto.category);

      const archive = await this.prisma.archive.create({
        data: {
          brandId: brand.id,
          timelineId: timeline.id,
          categoryId: category.id,
          story: dto.story,
          imageUrls: dto.imageUrls || [],
          isJudgementAllow: dto.isJudgementAllow,
          isPriceJudgementAllow: dto.isPriceJudgementAllow,
          authorId: userId,
        },
      });

      return {
        archiveId: archive.id,
        createdAt: archive.createdAt.toISOString(),
      };
    } catch (error) {
      throw new ServiceTemporarilyUnavailableException(
        '일시적 오류로 아카이브 등록 실패(재시도 요청)',
      );
    }
  }

  async updateArchive(
    userId: UUID,
    archiveId: UUID,
    dto: UpdateArchiveDto,
  ): Promise<void> {
    try {
      const archive = await this.prisma.archive.findUnique({
        where: { id: archiveId },
      });

      if (!archive || archive.deletedAt) {
        throw new NotFoundException('존재하지 않는 아카이브 id');
      }

      if (archive.authorId !== userId) {
        throw new ForbiddenException('아카이브를 수정할 권한이 없습니다');
      }

      // 브랜드, 타임라인, 카테고리 조회
      const brand = await this.findBrand(dto.brand);
      const timeline = await this.findTimeline(dto.timeline);
      const category = await this.findCategory(dto.category);

      await this.prisma.archive.update({
        where: { id: archiveId },
        data: {
          brandId: brand.id,
          timelineId: timeline.id,
          categoryId: category.id,
          story: dto.story,
          imageUrls: dto.imageUrls || [],
          isJudgementAllow: dto.isJudgementAllow,
          isPriceJudgementAllow: dto.isPriceJudgementAllow,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new ServiceTemporarilyUnavailableException(
        '일시적 오류로 아카이브 수정 실패(재시도 요청)',
      );
    }
  }

  async deleteArchive(userId: UUID, archiveId: UUID): Promise<void> {
    try {
      const archive = await this.prisma.archive.findUnique({
        where: { id: archiveId },
      });

      if (!archive || archive.deletedAt) {
        throw new NotFoundException('존재하지 않는 아카이브 id');
      }

      if (archive.authorId !== userId) {
        throw new ForbiddenException('아카이브를 삭제할 권한이 없습니다');
      }

      // Soft delete
      await this.prisma.archive.update({
        where: { id: archiveId },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new ServiceTemporarilyUnavailableException(
        '일시적 오류로 아카이브 삭제 실패(재시도 요청)',
      );
    }
  }

  async createJudgement(
    userId: UUID,
    archiveId: UUID,
    dto: CreateJudgementDto,
  ): Promise<CreateJudgementResponseDto> {
    try {
      const archive = await this.prisma.archive.findUnique({
        where: { id: archiveId },
      });

      if (!archive || archive.deletedAt) {
        throw new NotFoundException('존재하지 않는 아카이브 id');
      }

      // 이미 판정한 경우 체크
      const existingJudgement = await this.prisma.judgement.findFirst({
        where: {
          archiveId,
          memberId: userId,
        },
      });

      if (existingJudgement) {
        throw new ForbiddenException('이미 판정한 아카이브입니다');
      }

      const judgement = await this.prisma.judgement.create({
        data: {
          archiveId,
          memberId: userId,
          isArchive: dto.isAchive,
          comment: dto.comment,
          price: dto.price ? BigInt(dto.price) : null,
        },
      });

      // 평균 가격 업데이트
      await this.updateAveragePrice(archiveId);

      return {
        judgementId: judgement.id,
        createdAt: judgement.createdAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new ServiceTemporarilyUnavailableException(
        '일시적 오류로 아카이브 판정 등록 실패(재시도 요청)',
      );
    }
  }

  async getComments(
    userId: UUID,
    query: GetCommentsQueryDto,
  ): Promise<GetCommentsResponseDto> {
    const { archiving, page = 1 } = query;
    const skip = (page - 1) * this.PAGE_SIZE;

    // 내가 작성한 모든 아카이브에 달린 코멘트 조회
    const comments = await this.prisma.judgement.findMany({
      where: {
        archive: {
          authorId: userId,
          deletedAt: null,
        },
        isArchive: archiving,
        comment: { not: null },
      },
      skip,
      take: this.PAGE_SIZE + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        member: true,
        archive: true,
      },
    });

    const hasNext = comments.length > this.PAGE_SIZE;
    const items = comments.slice(0, this.PAGE_SIZE);

    const commentItems: CommentItemDto[] = items.map((comment) => ({
      memberNickName: comment.member.nickname,
      memberImageUrl: comment.member.imageUrl,
      comment: comment.comment,
      publishedAt: TimeUtil.getRelativeTime(comment.createdAt),
    }));

    return {
      isArchive: archiving,
      page,
      hasNext,
      comments: commentItems,
    };
  }

  async getInterestArchives(
    userId: UUID,
    query: GetInterestArchivesQueryDto,
  ): Promise<GetInterestArchivesResponseDto> {
    const { page = 1 } = query;
    const skip = (page - 1) * this.PAGE_SIZE;

    const interests = await this.prisma.archiveInterest.findMany({
      where: {
        memberId: userId,
        deletedAt: null,
      },
      skip,
      take: this.PAGE_SIZE + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        archive: true,
      },
    });

    const hasNext = interests.length > this.PAGE_SIZE;
    const items = interests.slice(0, this.PAGE_SIZE);

    const archiveItems: InterestArchiveItemDto[] = items.map((interest) => ({
      archiveId: interest.archive.id,
      imageUrls: interest.archive.imageUrls,
    }));

    return {
      page,
      hasNext,
      archives: archiveItems,
    };
  }

  async createInterestArchive(
    userId: UUID,
    archiveId: UUID,
  ): Promise<CreateInterestArchiveResponseDto> {
    try {
      // 아카이브 존재 여부 확인
      const archive = await this.prisma.archive.findUnique({
        where: { id: archiveId },
      });

      if (!archive || archive.deletedAt) {
        throw new NotFoundException('존재하지 않는 아카이브 id');
      }

      // 이미 관심 등록되어 있는지 확인
      const existingInterest = await this.prisma.archiveInterest.findFirst({
        where: {
          memberId: userId,
          archiveId,
          deletedAt: null,
        },
      });

      // 이미 등록되어 있으면 그대로 반환
      if (existingInterest) {
        return { archiveId };
      }

      // 관심 아카이브 등록
      await this.prisma.archiveInterest.create({
        data: {
          memberId: userId,
          archiveId,
        },
      });

      return { archiveId };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ServiceTemporarilyUnavailableException(
        '일시적 오류로 관심 아카이브 등록 실패(재시도 요청)',
      );
    }
  }

  async deleteInterestArchive(
    userId: UUID,
    archiveId: UUID,
  ): Promise<void> {
    try {
      const interest = await this.prisma.archiveInterest.findFirst({
        where: {
          memberId: userId,
          archiveId,
          deletedAt: null,
        },
      });

      if (!interest) {
        throw new NotFoundException('존재하지 않는 아카이브 id');
      }

      // Soft delete
      await this.prisma.archiveInterest.update({
        where: { id: interest.id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ServiceTemporarilyUnavailableException(
        '일시적 오류로 관심 아카이브 삭제 실패(재시도 요청)',
      );
    }
  }

  // Helper methods
  private async findBrand(name: string) {
    const brand = await this.prisma.brand.findFirst({
      where: { name },
    });

    if (!brand) {
      throw new NotFoundException(`존재하지 않는 브랜드: ${name}`);
    }

    return brand;
  }

  private async findTimeline(name: string) {
    const timeline = await this.prisma.timeline.findFirst({
      where: { name },
    });

    if (!timeline) {
      throw new NotFoundException(`존재하지 않는 타임라인: ${name}`);
    }

    return timeline;
  }

  private async findCategory(name: string) {
    const category = await this.prisma.category.findFirst({
      where: { name },
    });

    if (!category) {
      throw new NotFoundException(`존재하지 않는 카테고리: ${name}`);
    }

    return category;
  }

  // 필터링 목록 조회 (통합)
  async getFiltering(
    query: GetFilteringQueryDto,
  ): Promise<GetBrandsResponseDto | GetTimelinesResponseDto | GetCategoriesResponseDto> {
    const { name } = query;

    try {
      if (name === 'brand') {
        const brands = await this.prisma.brand.findMany({
          orderBy: { name: 'asc' },
          select: { name: true },
        });

        return {
          brands: brands.map((brand) => ({ name: brand.name })),
        };
      } else if (name === 'timeline') {
        const timelines = await this.prisma.timeline.findMany({
          orderBy: { name: 'asc' },
          select: { name: true },
        });

        return {
          timelines: timelines.map((timeline) => ({ name: timeline.name })),
        };
      } else {
        // name === 'category'
        const categories = await this.prisma.category.findMany({
          orderBy: { name: 'asc' },
          select: { name: true },
        });

        return {
          categories: categories.map((category) => ({ name: category.name })),
        };
      }
    } catch (error) {
      throw new ServiceTemporarilyUnavailableException(
        '일시적 오류로 필터링 옵션 조회 실패(재시도 요청)',
      );
    }
  }

  private async updateAveragePrice(archiveId: UUID) {
    const judgements = await this.prisma.judgement.findMany({
      where: {
        archiveId,
        price: { not: null },
      },
      select: { price: true },
    });

    if (judgements.length > 0) {
      const total = judgements.reduce(
        (sum, j) => sum + Number(j.price),
        0,
      );
      const average = Math.round(total / judgements.length);

      await this.prisma.archive.update({
        where: { id: archiveId },
        data: { averageJudgementPrice: BigInt(average) },
      });
    }
  }
}

