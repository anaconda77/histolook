import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SecessionDto {
  @ApiProperty({ description: '탈퇴 사유' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

