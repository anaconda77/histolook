import { ApiProperty } from '@nestjs/swagger';

export class GetAlarmCountResponseDto {
  @ApiProperty({ description: '읽지 않은 알림 개수' })
  count: number;
}

