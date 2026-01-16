# FCM (Firebase Cloud Messaging) 설정 가이드

이 문서는 HistoLook 프로젝트에 FCM 메시징 기능을 설정하는 방법을 설명합니다.

## 목차
1. [백엔드 설정](#백엔드-설정)
2. [프론트엔드 설정](#프론트엔드-설정)
3. [Firebase 프로젝트 설정](#firebase-프로젝트-설정)
4. [사용 방법](#사용-방법)

## 백엔드 설정

### 1. 필요한 패키지 설치

```bash
cd backend
npm install firebase-admin
```

### 2. Firebase 서비스 계정 키 설정

Firebase Console에서 서비스 계정 키를 다운로드하고, 다음 중 하나의 방법으로 설정합니다:

#### 방법 1: 환경변수로 JSON 문자열 설정 (권장)

`.env` 파일에 추가:
```env
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project-id",...}'
```

#### 방법 2: 파일 경로로 설정

서비스 계정 키 파일을 `backend/firebase-service-account.json`에 저장하고, 환경변수 설정:
```env
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
```

### 3. 데이터베이스 마이그레이션

Prisma 스키마에 `DeviceToken` 모델이 추가되었으므로 마이그레이션을 실행합니다:

```bash
cd backend
npm run prisma:migrate
npm run prisma:generate
```

### 4. 백엔드 서버 재시작

```bash
npm run start:dev
```

## 프론트엔드 설정

### 1. 필요한 패키지 설치

```bash
cd frontend
npx expo install expo-notifications expo-device
```

### 2. app.json 설정

`app.json` 또는 `app.config.js`에 다음 설정을 추가:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "your-expo-project-id"
      }
    }
  }
}
```

### 3. Expo Project ID 확인

Expo 프로젝트 ID가 없으면 다음 명령어로 생성:

```bash
npx expo install expo-constants
```

또는 EAS CLI 사용:
```bash
npm install -g eas-cli
eas init
```

### 4. 환경변수 설정

`.env` 파일에 추가:
```env
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
```

## Firebase 프로젝트 설정

### 1. Firebase Console에서 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 프로젝트 설정 > 일반 탭에서 프로젝트 ID 확인

### 2. 서비스 계정 키 생성

1. Firebase Console > 프로젝트 설정 > 서비스 계정 탭
2. "새 비공개 키 만들기" 클릭
3. JSON 파일 다운로드
4. 백엔드 설정에 따라 환경변수 또는 파일로 설정

### 3. Cloud Messaging API 활성화

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택
3. API 및 서비스 > 라이브러리
4. "Firebase Cloud Messaging API" 검색 및 활성화

## 사용 방법

### 백엔드 API

#### 1. FCM 토큰 등록

```http
POST /api/v1/fcm/token
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "token": "expo-push-token",
  "platform": "ios",
  "deviceId": "optional-device-id"
}
```

#### 2. 알림 전송 및 DB 저장

```http
POST /api/v1/fcm/send
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "알림 제목",
  "content": "알림 내용",
  "alarmType": "LIKE",
  "imageUrl": "https://example.com/image.jpg",
  "resourcePath": "/archive-detail/123",
  "userIds": ["user-uuid-1", "user-uuid-2"] // 선택사항, 없으면 전체 알림
}
```

#### 3. FCM 토큰 삭제

```http
DELETE /api/v1/fcm/token
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "token": "expo-push-token"
}
```

### 프론트엔드

앱이 시작되면 자동으로 FCM 토큰이 등록됩니다. `_layout.tsx`에서 자동 처리됩니다.

알림을 수신하면:
- 포그라운드: `setupNotificationListeners`의 첫 번째 콜백 호출
- 백그라운드/종료 상태: 알림 탭 시 두 번째 콜백 호출, `resourcePath`로 자동 이동

## 알림 타입 예시

- `LIKE`: 좋아요 알림
- `COMMENT`: 댓글 알림
- `JUDGEMENT`: 판정 알림
- `FOLLOW`: 팔로우 알림
- `GLOBAL`: 전체 알림

## 문제 해결

### 백엔드

1. **Firebase Admin 초기화 실패**
   - 서비스 계정 키가 올바른지 확인
   - 환경변수 설정 확인

2. **토큰 전송 실패**
   - Firebase Cloud Messaging API 활성화 확인
   - 서비스 계정 권한 확인

### 프론트엔드

1. **토큰 등록 실패**
   - 알림 권한이 허용되었는지 확인
   - Expo Project ID 설정 확인
   - 실제 디바이스에서 테스트 (에뮬레이터에서는 작동하지 않을 수 있음)

2. **알림 수신 안 됨**
   - 디바이스 알림 설정 확인
   - 앱이 백그라운드에 있는지 확인
   - Firebase Console에서 테스트 알림 전송

## 참고 자료

- [Expo Notifications 문서](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Firebase Admin SDK 문서](https://firebase.google.com/docs/admin/setup)
- [FCM 문서](https://firebase.google.com/docs/cloud-messaging)
