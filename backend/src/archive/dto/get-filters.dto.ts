import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

export class GetFilteringQueryDto {
  @ApiProperty({ 
    description: '필터링 옵션 타입', 
    enum: ['brand', 'timeline', 'category'],
    example: 'brand'
  })
  @IsString()
  @IsIn(['brand', 'timeline', 'category'], { 
    message: '잘못된 필터링 옵션' 
  })
  name: 'brand' | 'timeline' | 'category';
}

export class FilterItemDto {
  @ApiProperty({ description: '항목 이름' })
  name: string;
}

export class GetBrandsResponseDto {
  @ApiProperty({ description: '브랜드 목록', type: [FilterItemDto] })
  brands: FilterItemDto[];
}

export class GetTimelinesResponseDto {
  @ApiProperty({ description: '타임라인 목록', type: [FilterItemDto] })
  timelines: FilterItemDto[];
}

export class GetCategoriesResponseDto {
  @ApiProperty({ description: '카테고리 목록', type: [FilterItemDto] })
  categories: FilterItemDto[];
}

