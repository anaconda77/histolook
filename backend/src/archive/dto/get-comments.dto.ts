import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class GetCommentsQueryDto {
  @ApiProperty({ description: '아카이브 여부 (true: 아카이브, false: 탈아카이브)' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  archiving: boolean;

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

export class CommentItemDto {
  @ApiProperty()
  memberNickName: string;

  @ApiProperty()
  memberImageUrl: string;

  @ApiProperty()
  comment: string;

  @ApiProperty()
  publishedAt: string;
}

export class GetCommentsResponseDto {
  @ApiProperty()
  isArchive: boolean;

  @ApiProperty()
  page: number;

  @ApiProperty()
  hasNext: boolean;

  @ApiProperty({ type: [CommentItemDto] })
  comments: CommentItemDto[];
}

