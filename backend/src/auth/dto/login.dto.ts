import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: '공급자 (google, kakao, apple 등)' })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({ description: '소셜 액세스 토큰' })
  @IsString()
  @IsNotEmpty()
  socialAccessToken: string;
}

export class LoginResponseDto {
  @ApiProperty()
  isRegistered: boolean;

  @ApiProperty({ required: false })
  accessToken?: string;

  @ApiProperty({ required: false })
  refreshToken?: string;

  @ApiProperty({ required: false })
  authUserId?: string;
}

