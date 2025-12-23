import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 400 Bad Request: UUID 형식 오류
 */
export class InvalidUuidException extends HttpException {
  constructor(message = '아카이브 id가 uuid 형식이 아님') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

/**
 * 400 Bad Request: 유효하지 않은 페이지 번호
 */
export class InvalidPageNumberException extends HttpException {
  constructor(message = '유효하지 않은 페이지 넘버') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

/**
 * 400 Bad Request: 잘못된 필터링 파라미터
 */
export class InvalidFilterException extends HttpException {
  constructor(message = '올바르지 않은 필터링 파라미터 조건') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

/**
 * 400 Bad Request: 유효하지 않은 공급자
 */
export class InvalidProviderException extends HttpException {
  constructor(message = '유효하지 않은 공급자') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

/**
 * 400 Bad Request: 토큰 누락
 */
export class MissingTokenException extends HttpException {
  constructor(message = '액세스/리프레쉬 토큰 누락') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

/**
 * 400 Bad Request: 공급자 ID 누락
 */
export class MissingProviderIdException extends HttpException {
  constructor(message = '공급자 id 누락') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

/**
 * 400 Bad Request: 닉네임 관련 오류
 */
export class InvalidNicknameException extends HttpException {
  constructor(message = '닉네임 누락 혹은 유효하지 않은 닉네임') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

/**
 * 400 Bad Request: 브랜드 관련 오류
 */
export class InvalidBrandInterestsException extends HttpException {
  constructor(message = '관심 브랜드 누락 혹은 유효하지 않은 브랜드(혹은 개수 초과)') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

/**
 * 401 Unauthorized: 유효하지 않은 소셜 토큰
 */
export class InvalidSocialTokenException extends HttpException {
  constructor(message = '유효하지 않은 소셜 액세스 토큰') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

/**
 * 409 Conflict: 이미 존재하는 리소스
 */
export class AlreadyExistsException extends HttpException {
  constructor(message = '이미 가입된 회원') {
    super(message, HttpStatus.CONFLICT);
  }
}

/**
 * 503 Service Unavailable: 일시적 오류
 */
export class ServiceTemporarilyUnavailableException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

/**
 * 503 Service Unavailable: 소셜 공급자 오류
 */
export class SocialProviderErrorException extends HttpException {
  constructor(message = '소셜 공급자 접촉 실패(타임아웃 등 에러)') {
    super(message, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

