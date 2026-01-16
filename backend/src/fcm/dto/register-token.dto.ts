import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class RegisterTokenDto {
  @ApiProperty({ description: 'FCM 토큰' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: '플랫폼 (ios 또는 android)', enum: ['ios', 'android'] })
  @IsString()
  @IsIn(['ios', 'android'])
  platform: 'ios' | 'android';

  @ApiProperty({ description: '디바이스 ID (선택사항)', required: false })
  @IsString()
  @IsOptional()
  deviceId?: string;
}

export class RegisterTokenResponseDto {
  @ApiProperty()
  message: string;
}
