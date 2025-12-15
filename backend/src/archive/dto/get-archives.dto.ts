import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetArchivesQueryDto {
  @ApiPropertyOptional({ description: '페이지 번호', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '브랜드 필터' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: '타임라인 필터' })
  @IsOptional()
  @IsString()
  timeline?: string;

  @ApiPropertyOptional({ description: '카테고리 필터' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class ArchiveItemDto {
  @ApiProperty()
  archiveId: string;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiProperty()
  isInterest: boolean;
}

export class GetArchivesResponseDto {
  @ApiPropertyOptional()
  brand?: string;

  @ApiPropertyOptional()
  timeline?: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiProperty()
  page: number;

  @ApiProperty()
  hasNext: boolean;

  @ApiProperty({ type: [ArchiveItemDto] })
  archives: ArchiveItemDto[];
}

