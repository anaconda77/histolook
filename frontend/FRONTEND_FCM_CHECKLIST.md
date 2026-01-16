# 프론트엔드 FCM 설정 체크리스트

## ✅ 완료된 설정

1. ✅ `expo-notifications` 플러그인 추가됨 (`app.json`)
2. ✅ `expo-notifications`, `expo-device` 패키지 설치됨

## ⚠️ 추가로 필요한 설정

### 1. Expo Project ID 설정 (필수)

현재 `app.json`에 `YOUR_EXPO_PROJECT_ID`가 플레이스홀더로 설정되어 있습니다.

#### 방법 1: EAS CLI로 생성 (권장)

```bash
cd frontend
npm install -g eas-cli
eas init
```

이 명령어를 실행하면:
- Expo 계정 로그인 요청
- 프로젝트 ID 자동 생성 및 `app.json`에 추가

#### 방법 2: 수동으로 설정

1. [Expo Dashboard](https://expo.dev/) 접속
2. 프로젝트 생성 또는 선택
3. Settings에서 Project ID 확인
4. `app.json`의 `extra.eas.projectId`에 입력

#### 방법 3: 환경변수로 설정

`.env` 파일에 추가 (프로젝트 루트에):

```env
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
```

그리고 `app.json`에서 `extra.eas.projectId` 제거 (환경변수 우선)

### 2. 환경변수 파일 생성 (선택사항)

프로젝트 루트에 `.env` 파일 생성:

```env
# Expo Project ID (필수)
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id

# API Base URL (이미 설정되어 있을 수 있음)
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## 설정 확인 방법

### 1. 패키지 설치 확인

```bash
cd frontend
npm list expo-notifications expo-device
```

### 2. app.json 설정 확인

```bash
cd frontend
npx expo config
```

Project ID가 올바르게 설정되었는지 확인

### 3. 앱 실행 및 테스트

```bash
cd frontend
npx expo start
```

실제 디바이스에서 실행 후:
- 알림 권한 요청 팝업 확인
- 콘솔에서 "Expo Push Token" 출력 확인
- "FCM token registered successfully" 메시지 확인

## 문제 해결

### Expo Project ID 오류

```
Error: Expo project ID is required
```

해결:
1. `eas init` 실행하여 Project ID 생성
2. 또는 `app.json`에 수동으로 추가

### 알림 권한이 요청되지 않음

- 실제 디바이스에서 테스트 (에뮬레이터에서는 작동하지 않을 수 있음)
- 앱 재설치 후 다시 시도

### 토큰이 등록되지 않음

1. 로그인 상태 확인
2. 백엔드 API 엔드포인트 확인
3. 네트워크 연결 확인
4. 콘솔 로그 확인

## 다음 단계

1. Expo Project ID 설정
2. 앱 실행 및 알림 권한 허용
3. 토큰 등록 확인
4. 백엔드에서 알림 전송 테스트
