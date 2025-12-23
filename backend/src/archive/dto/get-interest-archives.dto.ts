import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetInterestArchivesQueryDto {
  @ApiPropertyOptional({ description: '페이지 번호', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '정렬 방식', default: 'recent' })
  @IsOptional()
  @IsString()
  sort?: string = 'recent';
}

export class InterestArchiveItemDto {
  @ApiProperty()
  archiveId: string;

  @ApiProperty({ type: [String], description: '이미지 URL 배열' })
  imageUrls: string[];
}

export class GetInterestArchivesResponseDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  hasNext: boolean;

  @ApiProperty({ type: [InterestArchiveItemDto] })
  archives: InterestArchiveItemDto[];
}

