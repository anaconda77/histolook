import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateJudgementDto {
  @ApiProperty({ description: '아카이브 판정 (true: 아카이브, false: 탈아카이브)' })
  @IsBoolean()
  isArchive: boolean;

  @ApiPropertyOptional({ description: '코멘트' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ description: '가격' })
  @IsOptional()
  @IsNumber()
  price?: number;
}

export class CreateJudgementResponseDto {
  @ApiProperty()
  judgementId: string;

  @ApiProperty()
  createdAt: string;
}

