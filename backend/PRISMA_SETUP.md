# Prisma Setup Guide

## 설치 완료 항목

✅ Prisma v7.1.0 설치 완료
✅ Prisma Client v7.1.0 설치 완료
✅ PostgreSQL datasource 설정 완료
✅ PrismaService 및 PrismaModule 생성 완료
✅ AppModule에 PrismaModule 등록 완료

## 디렉토리 구조

```
backend/
├── prisma/
│   └── schema.prisma          # Prisma 스키마 정의
├── prisma.config.ts           # Prisma 7 설정 파일
├── src/
│   ├── prisma/
│   │   ├── prisma.service.ts  # Prisma 서비스
│   │   └── prisma.module.ts   # Prisma 모듈
│   └── app.module.ts          # PrismaModule import
├── .env                       # 환경 변수 (Git 무시됨)
└── .env.example              # 환경 변수 예시
```

## 환경 변수 설정

`.env` 파일을 열고 데이터베이스 연결 정보를 수정하세요:

### 로컬 PostgreSQL
```env
DATABASE_URL="postgresql://username:password@localhost:5432/histolook?schema=public"
```

### Supabase
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

## 사용 가능한 명령어

### Prisma Client 생성
```bash
npm run prisma:generate
```

### 데이터베이스 마이그레이션
```bash
npm run prisma:migrate
```

### Prisma Studio 실행 (GUI)
```bash
npm run prisma:studio
```

### 시드 데이터 실행 (옵션)
```bash
npm run prisma:seed
```

## 모델 정의 방법

`prisma/schema.prisma` 파일에 모델을 정의하세요:

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

모델 정의 후 다음 명령어를 실행하세요:

```bash
# 1. Prisma Client 재생성
npm run prisma:generate

# 2. 마이그레이션 생성 및 적용
npm run prisma:migrate
```

## NestJS에서 사용 방법

PrismaService는 전역 모듈로 등록되어 있어 어디서든 주입받아 사용할 수 있습니다:

### 1. 서비스에서 사용

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: { email: string; name?: string }) {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: { name?: string; email?: string }) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
```

### 2. 컨트롤러에서 사용

```typescript
import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  create(@Body() createUserDto: { email: string; name?: string }) {
    return this.userService.create(createUserDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: { name?: string }) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
```

### 3. DTO 사용 (권장)

class-validator를 사용한 DTO 예시:

```bash
npm install class-validator class-transformer
```

```typescript
// create-user.dto.ts
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  name?: string;
}
```

## Prisma 주요 기능

### 1. 조회 (Query)

```typescript
// 모두 조회
await this.prisma.user.findMany();

// 조건부 조회
await this.prisma.user.findMany({
  where: {
    email: { contains: '@example.com' },
  },
});

// 관계 포함
await this.prisma.user.findMany({
  include: {
    posts: true,
  },
});

// 정렬 및 페이지네이션
await this.prisma.user.findMany({
  orderBy: { createdAt: 'desc' },
  skip: 0,
  take: 10,
});
```

### 2. 생성 (Create)

```typescript
// 단일 생성
await this.prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
  },
});

// 관계와 함께 생성
await this.prisma.user.create({
  data: {
    email: 'user@example.com',
    posts: {
      create: [
        { title: 'Post 1', content: 'Content 1' },
        { title: 'Post 2', content: 'Content 2' },
      ],
    },
  },
});
```

### 3. 업데이트 (Update)

```typescript
// 단일 업데이트
await this.prisma.user.update({
  where: { id: '123' },
  data: { name: 'Jane Doe' },
});

// 다중 업데이트
await this.prisma.user.updateMany({
  where: { email: { contains: '@old.com' } },
  data: { email: { set: '@new.com' } },
});
```

### 4. 삭제 (Delete)

```typescript
// 단일 삭제
await this.prisma.user.delete({
  where: { id: '123' },
});

// 다중 삭제
await this.prisma.user.deleteMany({
  where: { createdAt: { lt: new Date('2020-01-01') } },
});
```

### 5. 트랜잭션

```typescript
await this.prisma.$transaction([
  this.prisma.user.create({ data: { email: 'user1@example.com' } }),
  this.prisma.user.create({ data: { email: 'user2@example.com' } }),
]);

// 또는
await this.prisma.$transaction(async (prisma) => {
  const user = await prisma.user.create({
    data: { email: 'user@example.com' },
  });
  
  await prisma.post.create({
    data: {
      title: 'First Post',
      authorId: user.id,
    },
  });
});
```

## 마이그레이션

### 개발 환경

```bash
# 마이그레이션 생성 및 적용
npm run prisma:migrate

# 이름 지정하여 마이그레이션
npx prisma migrate dev --name add_user_role
```

### 프로덕션 환경

```bash
# 마이그레이션 적용 (without prompts)
npx prisma migrate deploy
```

### 마이그레이션 리셋 (개발 환경만!)

```bash
# 데이터베이스 초기화 및 재마이그레이션
npx prisma migrate reset
```

## 시드 데이터 (옵션)

`prisma/seed.ts` 파일을 생성하여 초기 데이터를 설정할 수 있습니다:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 기존 데이터 삭제 (옵션)
  await prisma.user.deleteMany();

  // 시드 데이터 생성
  const user1 = await prisma.user.create({
    data: {
      email: 'admin@histolook.com',
      name: 'Admin User',
    },
  });

  console.log({ user1 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

package.json에 추가:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

실행:

```bash
npm run prisma:seed
```

## Prisma Studio

Prisma Studio는 데이터베이스를 시각적으로 관리할 수 있는 GUI 도구입니다:

```bash
npm run prisma:studio
```

브라우저에서 `http://localhost:5555`로 접속하여 데이터를 조회, 생성, 수정, 삭제할 수 있습니다.

## 트러블슈팅

### Prisma Client를 찾을 수 없는 경우

```bash
npm run prisma:generate
```

### 마이그레이션이 실패하는 경우

1. 데이터베이스 연결 확인
2. DATABASE_URL 환경 변수 확인
3. 데이터베이스 권한 확인

### 타입 오류가 발생하는 경우

```bash
# Prisma Client 재생성
npm run prisma:generate

# TypeScript 컴파일러 재시작 (VSCode)
# Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"
```

## 추가 정보

- Prisma 공식 문서: https://www.prisma.io/docs
- Prisma 7 가이드: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-to-prisma-7
- NestJS with Prisma: https://docs.nestjs.com/recipes/prisma
- Prisma Schema 참고: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference
- Prisma Client API: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference
