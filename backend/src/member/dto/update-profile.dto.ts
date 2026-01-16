import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, ArrayMinSize, ArrayMaxSize, MinLength, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: '닉네임 (수정 시에만 필요)' })
  @IsString({ message: '닉네임 누락 혹은 유효 조건 위반' })
  @IsOptional()
  @MinLength(2, { message: '닉네임 누락 혹은 유효 조건 위반' })
  @MaxLength(10, { message: '닉네임 누락 혹은 유효 조건 위반' })
  nickname?: string;

  @ApiPropertyOptional({ description: '이미지 Object Name (Presigned URL로 업로드 후 받은 식별자, 수정 시에만 필요)' })
  @IsString()
  @IsOptional()
  imageObjectName?: string;

  @ApiPropertyOptional({ description: '관심 브랜드 배열 (수정 시에만 필요)', type: [String] })
  @IsArray({ message: '관심 브랜드 누락 혹은 유효하지 않은 브랜드(혹은 개수 초과)' })
  @IsOptional()
  @ArrayMinSize(1, { message: '관심 브랜드 누락 혹은 유효하지 않은 브랜드(혹은 개수 초과)' })
  @ArrayMaxSize(3, { message: '관심 브랜드 누락 혹은 유효하지 않은 브랜드(혹은 개수 초과)' })
  @IsString({ each: true, message: '관심 브랜드 누락 혹은 유효하지 않은 브랜드(혹은 개수 초과)' })
  brandInterests?: string[];
}

