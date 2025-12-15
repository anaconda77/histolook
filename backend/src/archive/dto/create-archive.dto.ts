import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsArray, IsOptional, ValidateIf } from 'class-validator';

export class CreateArchiveDto {
  @ApiProperty({ description: '브랜드' })
  @IsString()
  brand: string;

  @ApiProperty({ description: '타임라인' })
  @IsString()
  timeline: string;

  @ApiProperty({ description: '카테고리' })
  @IsString()
  category: string;

  @ApiProperty({ description: '스토리' })
  @IsString()
  story: string;

  @ApiProperty({ description: '판정 허용 여부' })
  @IsBoolean()
  isJudgementAllow: boolean;

  @ApiProperty({ description: '가격 판정 허용 여부' })
  @IsBoolean()
  @ValidateIf((o) => o.isJudgementAllow === true)
  isPriceJudgementAllow: boolean;

  @ApiPropertyOptional({ description: '이미지 URL 배열', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
}

export class CreateArchiveResponseDto {
  @ApiProperty()
  archiveId: string;

  @ApiProperty()
  createdAt: string;
}

