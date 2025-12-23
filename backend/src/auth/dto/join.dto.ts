import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsArray, ArrayMinSize } from 'class-validator';

export class JoinDto {
  @ApiProperty({ description: 'AuthUser ID' })
  @IsUUID()
  @IsNotEmpty()
  authUserId: string;

  @ApiProperty({ description: '닉네임' })
  @IsString()
  @IsNotEmpty()
  nickname: string;

  @ApiProperty({ description: '관심 브랜드 배열', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  brandInterests: string[];
}

export class JoinResponseDto {
  @ApiProperty({ description: '서비스 액세스 토큰' })
  accessToken: string;

  @ApiProperty({ description: '서비스 리프레시 토큰' })
  refreshToken: string;

  @ApiProperty()
  memberId: string;

  @ApiProperty()
  nickname: string;

  @ApiProperty()
  role: string;

  @ApiProperty({ nullable: true })
  imageUrl: string | null;

  @ApiProperty({ type: [String] })
  brandInterests: string[];

  @ApiProperty()
  authUserId: string;

  @ApiProperty()
  createdAt: string;
}

