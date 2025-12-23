import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminGetSupportsQueryDto {
  @ApiPropertyOptional({ description: '페이지 번호 (기본값: 1)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;
}

export class AdminSupportItemDto {
  @ApiProperty({ description: '문의글 ID' })
  supportPostId: string;

  @ApiProperty({ description: '회원 ID' })
  memberId: string;

  @ApiProperty({ description: '문의 유형' })
  supportType: string;

  @ApiProperty({ description: '제목' })
  title: string;

  @ApiPropertyOptional({ description: '답변 (Optional)', nullable: true })
  reply?: string | null;

  @ApiProperty({ description: '상태 (대기중, 답변 완료)' })
  status: string;

  @ApiProperty({ description: '발행 시간 (상대 시간)' })
  publishedAt: string;
}

export class AdminGetSupportsResponseDto {
  @ApiProperty({ description: '현재 페이지' })
  page: number;

  @ApiProperty({ description: '페이지당 개수' })
  size: number;

  @ApiProperty({ type: [AdminSupportItemDto], description: '문의글 리스트' })
  supports: AdminSupportItemDto[];
}

