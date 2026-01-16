import { ApiProperty } from '@nestjs/swagger';

/**
 * 아카이브 판정 코멘트 조회 응답 DTO
 */
export class ArchiveCommentDto {
  @ApiProperty({ description: '판정 ID' })
  judgementId: string;

  @ApiProperty({ description: '아카이빙 여부' })
  isArchive: boolean;

  @ApiProperty({ description: '코멘트', required: false })
  comment?: string;

  @ApiProperty({ description: '회원 ID' })
  memberId: string;

  @ApiProperty({ description: '회원 닉네임' })
  memberNickname: string;

  @ApiProperty({ description: '회원 프로필 이미지 URL', required: false })
  memberImageUrl?: string;

  @ApiProperty({ description: '작성 시간 (상대 시간)' })
  createdAt: string;
}

export class GetArchiveCommentsResponseDto {
  @ApiProperty({ type: [ArchiveCommentDto], description: '코멘트 리스트' })
  comments: ArchiveCommentDto[];
}

