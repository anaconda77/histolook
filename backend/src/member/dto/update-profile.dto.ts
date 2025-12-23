import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsNotEmpty, IsOptional, ArrayMinSize } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ description: '닉네임' })
  @IsString()
  @IsNotEmpty()
  nickname: string;

  @ApiProperty({ description: '역할' })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiPropertyOptional({ description: '이미지 URL' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ description: '관심 브랜드 배열', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  brandInterests: string[];
}

