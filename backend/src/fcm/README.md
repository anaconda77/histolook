# FCM (Firebase Cloud Messaging) 모듈

이 모듈은 Firebase Cloud Messaging을 사용하여 푸시 알림을 전송하는 기능을 제공합니다.

## 주요 기능

1. **FCM 토큰 관리**
   - 사용자 디바이스의 FCM 토큰 등록/업데이트
   - FCM 토큰 삭제
   - 사용자별 토큰 조회

2. **알림 전송**
   - 단일 사용자에게 알림 전송
   - 여러 사용자에게 알림 전송
   - 전체 사용자에게 알림 전송 (전체 알림)

3. **알림 DB 저장**
   - 알림 전송 시 자동으로 DB에 저장
   - 알림 타입, 이미지, 리소스 경로 등 저장

## API 엔드포인트

### 1. FCM 토큰 등록
```
POST /api/v1/fcm/token
Authorization: Bearer {accessToken}
Body: {
  "token": "expo-push-token",
  "platform": "ios" | "android",
  "deviceId": "optional-device-id"
}
```

### 2. FCM 토큰 삭제
```
DELETE /api/v1/fcm/token
Authorization: Bearer {accessToken}
Body: {
  "token": "expo-push-token"
}
```

### 3. 알림 전송 및 DB 저장
```
POST /api/v1/fcm/send
Authorization: Bearer {accessToken}
Body: {
  "title": "알림 제목",
  "content": "알림 내용",
  "alarmType": "LIKE",
  "imageUrl": "https://example.com/image.jpg",
  "resourcePath": "/archive-detail/123",
  "userIds": ["user-uuid-1"] // 선택사항, 없으면 전체 알림
}
```

## 환경변수 설정

`.env` 파일에 다음 중 하나를 설정:

```env
# 방법 1: JSON 문자열로 설정
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project-id",...}'

# 방법 2: 파일 경로로 설정
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
```

## 사용 예시

### 알림 전송 예시

```typescript
// 좋아요 알림
await fcmService.sendNotificationToUser(
  userId,
  '새로운 좋아요',
  '빈티지라이크 님이 회원님의 게시물을 좋아합니다.',
  {
    imageUrl: 'https://example.com/profile.jpg',
    resourcePath: '/archive-detail/123',
    alarmType: 'LIKE',
  }
);

// 판정 알림
await fcmService.sendNotificationToUser(
  userId,
  '새로운 판정',
  '빈티지라이크 님이 회원님의 게시물에 정가품 판정을 남겼습니다.',
  {
    resourcePath: '/archive-detail/123',
    alarmType: 'JUDGEMENT',
  }
);
```

## 주의사항

1. Firebase 서비스 계정 키는 절대 공개 저장소에 커밋하지 마세요.
2. 실패한 토큰은 자동으로 삭제됩니다.
3. 전체 알림 전송 시 많은 디바이스에 전송되므로 주의하세요.
