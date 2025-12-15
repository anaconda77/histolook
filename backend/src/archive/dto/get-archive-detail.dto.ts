import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MyJudgementDto {
  @ApiProperty()
  isArchive: boolean;

  @ApiPropertyOptional()
  price?: number;
}

export class CommentsDto {
  @ApiPropertyOptional()
  archivedOne?: string;

  @ApiPropertyOptional()
  deArchivedOne?: string;
}

export class GetArchiveDetailResponseDto {
  @ApiProperty()
  archiveId: string;

  @ApiProperty()
  brand: string;

  @ApiProperty()
  timeline: string;

  @ApiProperty()
  category: string;

  @ApiPropertyOptional()
  averagePrice?: number;

  @ApiProperty()
  story: string;

  @ApiProperty()
  authorId: string;

  @ApiPropertyOptional()
  authorImageUrl?: string;

  @ApiProperty()
  authorNickname: string;

  @ApiProperty()
  isJudged: boolean;

  @ApiPropertyOptional({ type: MyJudgementDto })
  myJudgement?: MyJudgementDto | null;

  @ApiPropertyOptional({ type: CommentsDto })
  comments?: CommentsDto;

  @ApiProperty()
  publishedAt: string;
}

