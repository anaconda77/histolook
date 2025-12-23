import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupportDetailDto {
  @ApiProperty({ description: '문의글 ID' })
  supportPostId: string;

  @ApiPropertyOptional({ description: '답변 (Optional)', nullable: true })
  reply?: string | null;
}

export class GetSupportDetailResponseDto {
  @ApiProperty({ type: [SupportDetailDto], description: '문의글 상세' })
  supports: SupportDetailDto[];
}

