import { ApiProperty } from '@nestjs/swagger';

export class AlarmItemDto {
  @ApiProperty({ description: '알림 ID' })
  id: string;

  @ApiProperty({ description: '알림 제목' })
  title: string;

  @ApiProperty({ description: '알림 내용' })
  content: string;

  @ApiProperty({ description: '알림 이미지 URL', nullable: true })
  imageUrl: string | null;

  @ApiProperty({ description: '리소스 경로 (프론트 URL)', nullable: true })
  resourcePath: string | null;

  @ApiProperty({ description: '발행 시간 (상대 시간, ex: 1시간 전)' })
  publishedAt: string;
}

export class GetMyAlarmsResponseDto {
  @ApiProperty({ type: [AlarmItemDto], description: '알림 리스트' })
  alarms: AlarmItemDto[];
}

