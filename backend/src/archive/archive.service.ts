import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
import { TimeUtil } from '../common/utils/time.util';

@Injectable()
export class ArchiveService {
  private readonly PAGE_SIZE = 20;

  constructor(private prisma: PrismaService) {}

  async getArchives(
    query: GetArchivesQueryDto,
    userId?: string,
  ): Promise<GetArchivesResponseDto> {
    const { page = 1, brand, timeline, category } = query;
    const skip = (page - 1) * this.PAGE_SIZE;

    // 필터 조건 구성
    const where: any = { deletedAt: null };
    
    if (brand) {
      where.brand = { name: brand };
    }
    if (timeline) {
      where.timeline = { name: timeline };
    }
    if (category) {
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
      imageUrl: undefined, // TODO: 이미지 URL 처리
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
  }

  async getArchiveDetail(
    archiveId: string,
    userId?: string,
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
      throw new NotFoundException('아카이브를 찾을 수 없습니다');
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
    userId: string,
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
      imageUrl: '', // TODO: 이미지 URL 처리
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
    userId: string,
    dto: CreateArchiveDto,
  ): Promise<CreateArchiveResponseDto> {
    // 브랜드, 타임라인, 카테고리 조회 또는 생성
    const brand = await this.findOrCreateBrand(dto.brand);
    const timeline = await this.findOrCreateTimeline(dto.timeline);
    const category = await this.findOrCreateCategory(dto.category);

    const archive = await this.prisma.archive.create({
      data: {
        brandId: brand.id,
        timelineId: timeline.id,
        categoryId: category.id,
        story: dto.story,
        authorId: userId,
      },
    });

    // TODO: 이미지 URL 처리 (imageUrls)

    return {
      archiveId: archive.id,
      createdAt: archive.createdAt.toISOString(),
    };
  }

  async updateArchive(
    userId: string,
    archiveId: string,
    dto: UpdateArchiveDto,
  ): Promise<void> {
    const archive = await this.prisma.archive.findUnique({
      where: { id: archiveId },
    });

    if (!archive || archive.deletedAt) {
      throw new NotFoundException('아카이브를 찾을 수 없습니다');
    }

    if (archive.authorId !== userId) {
      throw new ForbiddenException('아카이브를 수정할 권한이 없습니다');
    }

    // 브랜드, 타임라인, 카테고리 조회 또는 생성
    const brand = await this.findOrCreateBrand(dto.brand);
    const timeline = await this.findOrCreateTimeline(dto.timeline);
    const category = await this.findOrCreateCategory(dto.category);

    await this.prisma.archive.update({
      where: { id: archiveId },
      data: {
        brandId: brand.id,
        timelineId: timeline.id,
        categoryId: category.id,
        story: dto.story,
      },
    });

    // TODO: 이미지 URL 처리 (imageUrls)
  }

  async deleteArchive(userId: string, archiveId: string): Promise<void> {
    const archive = await this.prisma.archive.findUnique({
      where: { id: archiveId },
    });

    if (!archive || archive.deletedAt) {
      throw new NotFoundException('아카이브를 찾을 수 없습니다');
    }

    if (archive.authorId !== userId) {
      throw new ForbiddenException('아카이브를 삭제할 권한이 없습니다');
    }

    // Soft delete
    await this.prisma.archive.update({
      where: { id: archiveId },
      data: { deletedAt: new Date() },
    });
  }

  async createJudgement(
    userId: string,
    archiveId: string,
    dto: CreateJudgementDto,
  ): Promise<CreateJudgementResponseDto> {
    const archive = await this.prisma.archive.findUnique({
      where: { id: archiveId },
    });

    if (!archive || archive.deletedAt) {
      throw new NotFoundException('아카이브를 찾을 수 없습니다');
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
  }

  async getComments(
    archiveId: string,
    query: GetCommentsQueryDto,
  ): Promise<GetCommentsResponseDto> {
    const { archiving, page = 1 } = query;
    const skip = (page - 1) * this.PAGE_SIZE;

    const comments = await this.prisma.judgement.findMany({
      where: {
        archiveId,
        isArchive: archiving,
        comment: { not: null },
      },
      skip,
      take: this.PAGE_SIZE + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        member: true,
      },
    });

    const hasNext = comments.length > this.PAGE_SIZE;
    const items = comments.slice(0, this.PAGE_SIZE);

    const commentItems: CommentItemDto[] = items.map((comment) => ({
      memberNickName: comment.member.nickname,
      memberImageUrl: comment.member.imageUrl || '',
      comment: comment.comment || '',
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
    userId: string,
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
      imageUrl: '', // TODO: 이미지 URL 처리
    }));

    return {
      page,
      hasNext,
      archives: archiveItems,
    };
  }

  async deleteInterestArchive(
    userId: string,
    archiveId: string,
  ): Promise<void> {
    const interest = await this.prisma.archiveInterest.findFirst({
      where: {
        memberId: userId,
        archiveId,
        deletedAt: null,
      },
    });

    if (!interest) {
      throw new NotFoundException('관심 아카이브를 찾을 수 없습니다');
    }

    // Soft delete
    await this.prisma.archiveInterest.update({
      where: { id: interest.id },
      data: { deletedAt: new Date() },
    });
  }

  // Helper methods
  private async findOrCreateBrand(name: string) {
    let brand = await this.prisma.brand.findFirst({
      where: { name },
    });

    if (!brand) {
      brand = await this.prisma.brand.create({
        data: { name },
      });
    }

    return brand;
  }

  private async findOrCreateTimeline(name: string) {
    let timeline = await this.prisma.timeline.findFirst({
      where: { name },
    });

    if (!timeline) {
      timeline = await this.prisma.timeline.create({
        data: { name },
      });
    }

    return timeline;
  }

  private async findOrCreateCategory(name: string) {
    let category = await this.prisma.category.findFirst({
      where: { name },
    });

    if (!category) {
      category = await this.prisma.category.create({
        data: { name, krName: name },
      });
    }

    return category;
  }

  private async updateAveragePrice(archiveId: string) {
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

