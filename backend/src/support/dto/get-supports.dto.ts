import { ApiProperty } from '@nestjs/swagger';

export class SupportItemDto {
  @ApiProperty({ description: '문의글 ID' })
  supportPostId: string;

  @ApiProperty({ description: '문의 유형' })
  supportType: string;

  @ApiProperty({ description: '제목' })
  title: string;

  @ApiProperty({ description: '상태 (대기중, 답변 완료)' })
  status: string;
}

export class GetSupportsResponseDto {
  @ApiProperty({ type: [SupportItemDto], description: '문의글 리스트' })
  supports: SupportItemDto[];
}

