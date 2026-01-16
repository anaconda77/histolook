import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupportDetailDto {
  @ApiProperty({ description: '문의글 ID' })
  supportPostId: string;

  @ApiProperty({ description: '제목' })
  title: string;

  @ApiProperty({ description: '문의 유형' })
  supportType: string;

  @ApiProperty({ description: '문의 내용' })
  content: string;

  @ApiProperty({ description: '상태' })
  status: string;

  @ApiProperty({ description: '생성일시' })
  createdAt: string;

  @ApiPropertyOptional({ description: '답변 (Optional)', nullable: true })
  reply?: string | null;
}

export class GetSupportDetailResponseDto {
  @ApiProperty({ type: [SupportDetailDto], description: '문의글 상세' })
  supports: SupportDetailDto[];
}

