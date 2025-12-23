import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsNotEmpty } from 'class-validator';

export class GetProfileResponseDto {
  @ApiProperty()
  nickname: string;

  @ApiProperty()
  role: string;

  @ApiProperty({ nullable: true })
  imageUrl: string | null;

  @ApiProperty({ type: [String] })
  brandInterests: string[];
}

