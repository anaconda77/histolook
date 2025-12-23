import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class GetCommentsQueryDto {
  @ApiProperty({ 
    description: '판정 유형 (true: 아카이빙, false: 디아카이빙)',
    example: true 
  })
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

  @ApiProperty({ nullable: true })
  memberImageUrl: string | null;

  @ApiProperty({ nullable: true })
  comment: string | null;

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

