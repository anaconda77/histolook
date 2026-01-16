import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateNotificationSettingsDto {
  @ApiProperty({ description: '알림 수신 여부' })
  @IsBoolean()
  notificationEnabled: boolean;
}

export class NotificationSettingsResponseDto {
  @ApiProperty({ description: '알림 수신 여부' })
  notificationEnabled: boolean;
}
