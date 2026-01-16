# Firebase 서비스 계정 키 다운로드 가이드

## 서비스 계정 키란?

Firebase 서비스 계정 키는 백엔드 서버에서 Firebase Admin SDK를 사용하여 알림을 전송하기 위해 필요한 인증 정보입니다.

## 다운로드 방법

### 1단계: Firebase Console 접속

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 로그인 (Google 계정)
3. 프로젝트 선택

### 2단계: 프로젝트 설정 열기

1. Firebase Console 왼쪽 상단의 **톱니바퀴 아이콘(⚙️)** 클릭
2. **"프로젝트 설정"** 선택
   - 또는 프로젝트 개요 페이지에서 "프로젝트 설정" 클릭

### 3단계: 서비스 계정 탭 이동

1. 프로젝트 설정 페이지에서 상단 탭 중 **"서비스 계정"** 클릭
   - 일반, 클라우드 메시징, 서비스 계정, 사용자 및 권한 등 탭이 있음

### 4단계: 서비스 계정 키 생성

1. "서비스 계정" 탭에서 **"새 비공개 키 만들기"** 버튼 클릭
   - 또는 "키 생성" 버튼 (언어에 따라 다를 수 있음)

2. 경고 메시지 확인:
   - "이 키는 한 번만 다운로드할 수 있습니다"
   - "이 키를 안전하게 보관하세요"
   - 확인 버튼 클릭

### 5단계: JSON 파일 다운로드

1. JSON 파일이 자동으로 다운로드됩니다
2. 파일명 예시: `your-project-id-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`
3. 이 파일을 안전한 위치에 보관하세요

## 파일 내용 확인

다운로드된 JSON 파일의 구조:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com"
}
```

## 백엔드에 설정하기

### 방법 1: 환경변수로 JSON 문자열 설정 (권장)

1. 다운로드한 JSON 파일을 텍스트 에디터로 열기
2. 전체 내용을 복사
3. 백엔드 `.env` 파일에 추가:

```env
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project-id",...}'
```

**주의사항:**
- JSON 전체를 한 줄로 만들어야 함
- 작은따옴표(`'`)로 감싸기
- 내부의 큰따옴표(`"`)는 그대로 유지
- 줄바꿈 문자(`\n`)는 `\\n`으로 이스케이프

### 방법 2: 파일 경로로 설정

1. 다운로드한 JSON 파일을 `backend/firebase-service-account.json`에 저장
2. `.env` 파일에 추가:

```env
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
```

**주의사항:**
- 파일을 `.gitignore`에 추가하여 Git에 커밋하지 않기
- 절대 공개 저장소에 업로드하지 않기

## 보안 주의사항

### ⚠️ 중요

1. **절대 Git에 커밋하지 마세요**
   - `.gitignore`에 추가:
     ```
     firebase-service-account.json
     .env
     ```

2. **공개 저장소에 업로드하지 마세요**
   - 이 키로 프로젝트의 모든 리소스에 접근 가능

3. **환경변수 사용 권장**
   - 파일보다 환경변수가 더 안전
   - CI/CD 환경에서도 쉽게 설정 가능

4. **키가 유출된 경우**
   - Firebase Console > 프로젝트 설정 > 서비스 계정
   - 해당 키 삭제
   - 새 키 생성

## .gitignore 확인

`backend/.gitignore` 파일에 다음이 포함되어 있는지 확인:

```
.env
firebase-service-account.json
*.json
!package*.json
```

## 설정 확인

백엔드 서버를 시작하면 로그에 다음 메시지가 표시됩니다:

```
[FcmService] Firebase Admin initialized successfully
```

에러가 발생하면:
- 환경변수 설정 확인
- JSON 형식 확인
- 파일 경로 확인

## 문제 해결

### 키를 잃어버린 경우

1. Firebase Console > 프로젝트 설정 > 서비스 계정
2. 기존 키는 삭제할 수 있지만 다시 다운로드할 수 없음
3. "새 비공개 키 만들기"로 새 키 생성

### 권한 오류가 발생하는 경우

1. Firebase Console > 프로젝트 설정 > 서비스 계정
2. 서비스 계정에 필요한 권한이 있는지 확인
3. Cloud Messaging API가 활성화되어 있는지 확인

### JSON 파싱 오류

- JSON 형식이 올바른지 확인
- 환경변수에 작은따옴표로 감싸져 있는지 확인
- 특수문자 이스케이프 확인
