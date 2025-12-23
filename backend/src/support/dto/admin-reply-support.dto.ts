import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AdminReplySupportDto {
  @ApiProperty({ description: '답변 내용' })
  @IsString()
  @IsNotEmpty()
  reply: string;
}

