# 프론트엔드 FCM 설정 가이드

## 필요한 설정 목록

1. ✅ 패키지 설치 (expo-notifications, expo-device)
2. ⚠️ app.json에 expo-notifications 플러그인 추가
3. ⚠️ Expo Project ID 설정
4. ⚠️ 환경변수 설정 (선택사항)

## 1. 패키지 설치 확인

다음 패키지가 설치되어 있는지 확인:

```bash
cd frontend
npx expo install expo-notifications expo-device
```

## 2. app.json 설정 추가

`app.json`에 `expo-notifications` 플러그인을 추가해야 합니다:

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff",
          "dark": {
            "backgroundColor": "#000000"
          }
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/images/icon.png",
          "color": "#ffffff",
          "sounds": []
        }
      ]
    ]
  }
}
```

## 3. Expo Project ID 설정

### 방법 1: app.json에 직접 설정

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-expo-project-id"
      }
    }
  }
}
```

### 방법 2: 환경변수로 설정 (권장)

`.env` 파일에 추가:

```env
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
```

### Expo Project ID 확인/생성

#### 기존 프로젝트 ID 확인

```bash
cd frontend
npx expo config --type public | grep projectId
```

#### 새 프로젝트 ID 생성

```bash
cd frontend
npm install -g eas-cli
eas init
```

또는 Expo 웹사이트에서:
1. [Expo Dashboard](https://expo.dev/) 접속
2. 프로젝트 선택 또는 생성
3. Settings에서 Project ID 확인

## 4. 환경변수 설정 (선택사항)

프론트엔드 `.env` 파일 생성 (프로젝트 루트에):

```env
# Expo Project ID (필수)
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id

# API Base URL (이미 설정되어 있을 수 있음)
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## 5. 설정 확인

### 패키지 설치 확인

```bash
cd frontend
npm list expo-notifications expo-device
```

### app.json 설정 확인

```bash
cd frontend
npx expo config
```

### 환경변수 확인

앱 실행 시 콘솔에서 확인:
- Expo Push Token이 출력되는지 확인
- "FCM token registered successfully" 메시지 확인

## 6. 알림 권한 테스트

앱 실행 시:
1. 알림 권한 요청 팝업이 나타나는지 확인
2. 권한 허용 후 토큰이 등록되는지 확인
3. 백엔드에서 알림 전송 테스트

## 문제 해결

### Expo Project ID가 없는 경우

```bash
cd frontend
eas init
```

또는 `app.json`에 수동 추가:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

### 알림 권한이 요청되지 않는 경우

1. 실제 디바이스에서 테스트 (에뮬레이터에서는 작동하지 않을 수 있음)
2. 앱 설정에서 알림 권한 확인
3. 앱 재설치 후 다시 시도

### 토큰이 등록되지 않는 경우

1. 로그인 상태 확인 (토큰 등록은 인증 필요)
2. 백엔드 API 엔드포인트 확인
3. 네트워크 연결 확인
4. 콘솔 로그 확인

## 완료 체크리스트

- [ ] `expo-notifications`, `expo-device` 패키지 설치
- [ ] `app.json`에 `expo-notifications` 플러그인 추가
- [ ] Expo Project ID 설정 (app.json 또는 환경변수)
- [ ] 환경변수 `.env` 파일 생성 (선택사항)
- [ ] 앱 실행 및 알림 권한 허용
- [ ] 토큰 등록 확인 (콘솔 로그)
- [ ] 백엔드에서 알림 전송 테스트
