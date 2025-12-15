# Archive API 구현 문서

## 📁 프로젝트 구조

```
backend/src/
├── common/                          # 공통 모듈
│   ├── dto/
│   │   └── api-response.dto.ts     # 표준 API 응답 형식
│   ├── decorators/
│   │   ├── current-user.decorator.ts    # 현재 사용자 데코레이터
│   │   └── optional-auth.decorator.ts   # 선택적 인증 데코레이터
│   └── utils/
│       └── time.util.ts             # 시간 관련 유틸리티
│
├── archive/                         # Archive 도메인
│   ├── dto/
│   │   ├── get-archives.dto.ts      # 아카이브 리스트 조회 DTO
│   │   ├── get-archive-detail.dto.ts    # 아카이브 상세 조회 DTO
│   │   ├── get-my-archives.dto.ts   # 내 아카이브 조회 DTO
│   │   ├── create-archive.dto.ts    # 아카이브 생성 DTO
│   │   ├── update-archive.dto.ts    # 아카이브 수정 DTO
│   │   ├── create-judgement.dto.ts  # 판정 생성 DTO
│   │   ├── get-comments.dto.ts      # 코멘트 조회 DTO
│   │   └── get-interest-archives.dto.ts # 관심 아카이브 조회 DTO
│   ├── archive.controller.ts        # Archive 컨트롤러
│   ├── archive.service.ts           # Archive 서비스 (비즈니스 로직)
│   └── archive.module.ts            # Archive 모듈
│
├── prisma/                          # Prisma 모듈
│   ├── prisma.service.ts
│   └── prisma.module.ts
│
├── app.module.ts                    # 루트 모듈
└── main.ts                          # 애플리케이션 엔트리 포인트
```

## 🚀 구현된 API 엔드포인트

### 1. 아카이브 관련

#### 1.1 홈화면 아카이브 리스트 조회
- **Endpoint**: `GET /api/v1/archive`
- **Query Parameters**:
  - `page`: 페이지 번호 (default: 1)
  - `brand`: 브랜드 필터 (optional)
  - `timeline`: 타임라인 필터 (optional)
  - `category`: 카테고리 필터 (optional)
- **Auth**: Optional (Bearer Token)
- **기능**:
  - 페이지네이션 지원 (페이지당 20개)
  - 브랜드, 타임라인, 카테고리 필터링
  - 회원인 경우 관심 아카이브 여부 표시
  - 비회원은 isInterest가 항상 false

#### 1.2 아카이브 상세 조회
- **Endpoint**: `GET /api/v1/archive/:archiveId`
- **Auth**: Optional (Bearer Token)
- **기능**:
  - 아카이브 상세 정보 조회
  - 작성자 정보 포함
  - 회원인 경우 본인의 판정 정보 포함
  - 대표 코멘트 1개씩 (아카이브/탈아카이브)
  - 상대 시간 표시 (방금전, 1시간전 등)

#### 1.3 내 아카이브 리스트 조회
- **Endpoint**: `GET /api/v1/my/archive`
- **Query Parameters**:
  - `page`: 페이지 번호 (default: 1)
  - `sort`: 정렬 방식 (default: recent)
- **Auth**: Required (Bearer Token)
- **기능**:
  - 본인이 작성한 아카이브만 조회
  - 최신순 정렬

#### 1.4 아카이브 등록
- **Endpoint**: `POST /api/v1/archive`
- **Auth**: Required (Bearer Token)
- **Request Body**:
  ```json
  {
    "brand": "string",
    "timeline": "string",
    "category": "string",
    "story": "string",
    "isJudgementAllow": boolean,
    "isPriceJudgementAllow": boolean,
    "imageUrls": ["string", ...]
  }
  ```
- **기능**:
  - 새로운 아카이브 생성
  - 브랜드/타임라인/카테고리 자동 생성 (없을 경우)

#### 1.5 아카이브 수정
- **Endpoint**: `PUT /api/v1/archive/:archiveId`
- **Auth**: Required (Bearer Token)
- **Response**: 204 No Content
- **기능**:
  - 본인이 작성한 아카이브만 수정 가능
  - 권한 검증

#### 1.6 아카이브 삭제
- **Endpoint**: `DELETE /api/v1/archive/:archiveId`
- **Auth**: Required (Bearer Token)
- **Response**: 204 No Content
- **기능**:
  - Soft Delete 방식
  - 본인이 작성한 아카이브만 삭제 가능

### 2. 아카이브 판정 관련

#### 2.1 아카이브 판정 등록
- **Endpoint**: `POST /api/v1/archive/:archiveId/judgement`
- **Auth**: Required (Bearer Token)
- **Request Body**:
  ```json
  {
    "isAchive": boolean,
    "comment": "string (optional)",
    "price": number (optional)
  }
  ```
- **기능**:
  - 아카이브/탈아카이브 판정
  - 코멘트 및 가격 판정 (선택)
  - 중복 판정 방지
  - 평균 가격 자동 계산 및 업데이트

#### 2.2 코멘트 리스트 조회
- **Endpoint**: `GET /api/v1/my/archive/comments`
- **Query Parameters**:
  - `archiveId`: 아카이브 ID
  - `archiving`: boolean (true: 아카이브, false: 탈아카이브)
  - `page`: 페이지 번호 (default: 1)
  - `sort`: 정렬 방식 (default: recent)
- **Auth**: Optional (Bearer Token)
- **기능**:
  - 아카이브/탈아카이브 판정 코멘트 분리 조회
  - 페이지네이션 지원

### 3. 관심 아카이브 관련

#### 3.1 관심 아카이브 리스트 조회
- **Endpoint**: `GET /api/v1/interest/archive`
- **Query Parameters**:
  - `page`: 페이지 번호 (default: 1)
  - `sort`: 정렬 방식 (default: recent)
- **Auth**: Required (Bearer Token)
- **기능**:
  - 본인이 관심 표시한 아카이브 목록
  - 최신순 정렬

#### 3.2 관심 아카이브 삭제
- **Endpoint**: `DELETE /api/v1/interest/archive/:archiveId`
- **Auth**: Required (Bearer Token)
- **Response**: 204 No Content
- **기능**:
  - Soft Delete 방식
  - 관심 아카이브 해제

## 🔑 주요 기능

### 1. 표준 API 응답 형식
모든 API는 일관된 응답 형식을 사용합니다:

```typescript
{
  "status": "200 OK" | "201 Created" | "204 No Content",
  "message": "성공 메시지",
  "content": { ... }
}
```

### 2. 페이지네이션
- 페이지당 20개 아이템
- `hasNext` 필드로 다음 페이지 존재 여부 확인
- 1-based 페이지 번호

### 3. 인증 시스템
- **Required Auth**: 반드시 로그인 필요
- **Optional Auth**: 로그인 선택적 (로그인 시 추가 정보 제공)
- Bearer Token 방식

### 4. Soft Delete
- 아카이브 삭제 시 `deletedAt` 필드 설정
- 관심 아카이브 삭제 시 `deletedAt` 필드 설정
- 실제 데이터는 보존

### 5. 시간 표시
- 상대 시간 표시 (방금전, 1분전, 1시간전, 1일전, 1개월전, 1년전)
- `TimeUtil.getRelativeTime()` 활용

### 6. 자동 생성
- 브랜드, 타임라인, 카테고리가 없으면 자동 생성
- 중복 방지 (이름 기준 조회 후 생성)

### 7. 평균 가격 계산
- 판정 등록 시 자동으로 평균 가격 계산
- Archive 모델의 `averageJudgementPrice` 필드 업데이트

## 📦 사용된 패키지

```json
{
  "dependencies": {
    "@nestjs/common": "^11.0.1",
    "@nestjs/core": "^11.0.1",
    "@nestjs/platform-express": "^11.0.1",
    "@nestjs/swagger": "^8.0.1",
    "@prisma/client": "^7.1.0",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1"
  },
  "devDependencies": {
    "prisma": "^7.1.0"
  }
}
```

## 🛠️ 설정

### 1. Swagger 문서
- URL: `http://localhost:3000/api-docs`
- 모든 API 엔드포인트 문서화
- Bearer Auth 테스트 가능

### 2. Validation Pipe
- 자동 DTO 유효성 검증
- 타입 변환 자동화
- whitelist 옵션으로 불필요한 필드 제거

### 3. CORS
- 모든 origin 허용 (개발 환경)
- 프로덕션에서는 특정 origin만 허용 필요

## 🚀 실행 방법

### 개발 모드
```bash
cd backend
npm run start:dev
```

### 프로덕션 빌드
```bash
cd backend
npm run build
npm run start:prod
```

### API 문서 확인
```bash
# 서버 실행 후
http://localhost:3000/api-docs
```

## ⚠️ TODO 및 개선사항

1. **이미지 처리**
   - S3 이미지 업로드 구현 필요
   - imageUrls 필드 처리 로직 추가

2. **인증/인가**
   - JWT Guard 구현 필요
   - AuthUser 및 Member 연동
   - Role-based Access Control

3. **에러 처리**
   - 커스텀 Exception Filter
   - 에러 메시지 다국어 지원

4. **성능 최적화**
   - 캐싱 전략 (Redis)
   - 인덱스 최적화
   - N+1 쿼리 문제 해결

5. **테스트**
   - Unit Tests
   - E2E Tests
   - API Integration Tests

6. **보안**
   - Rate Limiting
   - Request Validation 강화
   - SQL Injection 방지

7. **모니터링**
   - Logging (Winston)
   - APM (Application Performance Monitoring)
   - Health Check 엔드포인트

## 📝 참고사항

- Prisma relationMode = "prisma"로 설정되어 물리적 FK 제약이 없습니다
- BigInt 타입은 Number로 변환하여 JSON 응답
- 모든 시간은 UTC 기준
- 페이지네이션은 오프셋 기반 (커서 기반으로 개선 가능)

---

**구현 완료 날짜**: 2025-12-15
**API 버전**: v1.0
**Framework**: NestJS 11.0
**Database**: PostgreSQL (Supabase)
**ORM**: Prisma 7.1

