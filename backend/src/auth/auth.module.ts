import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { KakaoOAuthService } from './kakao-oauth.service';
import { GoogleOAuthService } from './google-oauth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'histolook-secret-key', // TODO: .env로 이동
      signOptions: {
        expiresIn: '7d', // 액세스 토큰 만료시간
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, KakaoOAuthService, GoogleOAuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
