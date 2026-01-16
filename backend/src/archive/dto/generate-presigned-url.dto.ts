import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';

export class GeneratePresignedUrlDto {
  @ApiProperty({ description: '업로드할 이미지 파일 개수', minimum: 1, maximum: 10 })
  @IsNumber()
  @Min(1)
  @Max(10)
  fileCount: number;

  @ApiProperty({ description: 'URL 유효 기간 (분 단위)', minimum: 1, maximum: 60, default: 15, required: false })
  @IsNumber()
  @Min(1)
  @Max(60)
  expiresInMinutes?: number = 15;
}

export class GeneratePresignedUrlResponseDto {
  @ApiProperty({ description: 'Presigned URL 배열 (업로드용, 15분 유효)' })
  urls: string[];

  @ApiProperty({ description: '객체 이름 배열 (업로드 후 백엔드에 전달할 식별자)' })
  objectNames: string[];
}

