import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsUUID } from 'class-validator';

export class SendNotificationDto {
  @ApiProperty({ description: '알림 제목' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '알림 내용' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: '이미지 URL' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: '리소스 경로 (알림 클릭 시 이동할 경로)' })
  @IsString()
  @IsOptional()
  resourcePath?: string;

  @ApiProperty({ description: '알림 타입' })
  @IsString()
  @IsNotEmpty()
  alarmType: string;

  @ApiPropertyOptional({ 
    description: '사용자 ID 배열 (지정하지 않으면 전체 알림)',
    type: [String],
  })
  @IsArray()
  @IsUUID(4, { each: true })
  @IsOptional()
  userIds?: string[];
}

export class SendNotificationResponseDto {
  @ApiProperty()
  message: string;
  
  @ApiProperty()
  sentCount: number;
}
