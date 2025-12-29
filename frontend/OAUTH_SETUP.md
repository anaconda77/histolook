# HistoLook OAuth 로그인 설정 가이드

## 📋 개요

HistoLook 앱에서 카카오/구글 소셜 로그인을 사용하기 위한 설정 가이드입니다.

---

## 🔧 환경 변수 설정

프론트엔드 프로젝트 루트에 `.env` 파일을 생성하세요:

```bash
cd frontend
touch .env
```

`.env` 파일에 다음 내용을 추가:

```env
# API Base URL
EXPO_PUBLIC_API_URL=http://localhost:3000

# Kakao OAuth
EXPO_PUBLIC_KAKAO_REST_API_KEY=your_kakao_rest_api_key
EXPO_PUBLIC_KAKAO_REDIRECT_URI=http://localhost:3000/api/v1/auth/kakao/callback

# Google OAuth
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
EXPO_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/auth/google/callback
```

---

## 📦 필수 패키지 설치

```bash
cd frontend
npm install @react-native-async-storage/async-storage axios
```

---

## 🔐 카카오 로그인 설정

### 1. 카카오 개발자 콘솔 설정

1. [카카오 개발자 센터](https://developers.kakao.com) 접속
2. **내 애플리케이션** → 앱 선택 (또는 새로 생성)
3. **앱 설정** → **플랫폼** 추가
   - **iOS**: Bundle ID: `com.histolook.app`
   - **Android**: 패키지명: `com.histolook.app`
4. **제품 설정** → **카카오 로그인** → **Redirect URI** 등록
   - `http://localhost:3000/api/v1/auth/kakao/callback` (개발용)
   - 프로덕션 URL도 추가
5. **동의 항목** 설정
   - 닉네임: 필수
   - 이메일: 선택 (권장)

### 2. REST API 키 복사

**앱 키** → **REST API 키** 복사 → `.env` 파일의 `EXPO_PUBLIC_KAKAO_REST_API_KEY`에 붙여넣기

---

## 🔐 구글 로그인 설정

### 1. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트 생성 또는 선택
3. **API 및 서비스** → **사용자 인증 정보**
4. **+ 사용자 인증 정보 만들기** → **OAuth 2.0 클라이언트 ID**
5. 애플리케이션 유형:
   - **iOS**: Bundle ID: `com.histolook.app`
   - **Android**: 패키지명: `com.histolook.app`, SHA-1 인증서 지문 추가
6. **승인된 리디렉션 URI** 추가:
   - `http://localhost:3000/api/v1/auth/google/callback`
   - 프로덕션 URL도 추가

### 2. Client ID 복사

생성된 **클라이언트 ID** 복사 → `.env` 파일의 `EXPO_PUBLIC_GOOGLE_CLIENT_ID`에 붙여넣기

---

## 📱 앱 설정

### `app.json` 설정 확인

```json
{
  "expo": {
    "scheme": "histolook",
    "ios": {
      "bundleIdentifier": "com.histolook.app"
    },
    "android": {
      "package": "com.histolook.app"
    }
  }
}
```

---

## 🚀 실행 방법

### 1. 백엔드 서버 시작

```bash
cd backend
npm run start:dev
```

### 2. 프론트엔드 앱 시작

```bash
cd frontend
npx expo start
```

### 3. 테스트

1. 앱 실행
2. 로그인 화면에서 **카카오로 로그인하기** 또는 **구글로 로그인하기** 클릭
3. 브라우저에서 소셜 로그인 진행
4. 로그인 성공 시 앱으로 자동 복귀
5. 회원가입 페이지로 이동

---

## 🔄 OAuth 플로우

```
1. 사용자가 "카카오/구글로 로그인하기" 버튼 클릭
   ↓
2. 브라우저로 OAuth 로그인 페이지 열림
   ↓
3. 사용자가 소셜 로그인 완료
   ↓
4. 백엔드 콜백 URL로 인가 코드 전달
   ↓
5. 백엔드에서 액세스 토큰 발급 및 AuthUser 생성
   ↓
6. 앱으로 Deep Link 리다이렉트 (authUserId 포함)
   ↓
7. 회원가입 페이지로 이동
   ↓
8. 닉네임 & 관심 브랜드 입력
   ↓
9. 회원가입 완료 → JWT 토큰 발급
   ↓
10. 메인 화면으로 이동
```

---

## 📂 파일 구조

```
frontend/
├── app/
│   ├── login.tsx           # 로그인 화면
│   ├── signup.tsx          # 회원가입 화면
│   └── _layout.tsx         # 라우트 설정
├── services/
│   └── auth.api.ts         # Auth API 서비스
├── components/
│   └── google-login-button.tsx
├── .env                    # 환경 변수 (생성 필요)
└── app.json                # Deep Link 설정

backend/
└── src/auth/
    ├── auth.controller.ts  # 카카오/구글 콜백 처리
    ├── auth.service.ts
    └── kakao-oauth.service.ts
```

---

## ⚠️ 주의사항

1. **`.env` 파일은 `.gitignore`에 포함**되어야 합니다. (이미 설정됨)
2. **프로덕션 환경**에서는 HTTPS URL을 사용해야 합니다.
3. **Deep Link scheme**(`histolook://`)은 앱이 설치되어 있어야 작동합니다.
4. 개발 중에는 **Expo Go 앱이 아닌 개발 빌드**를 사용해야 합니다:
   ```bash
   npx expo run:ios
   # 또는
   npx expo run:android
   ```

---

## 🐛 문제 해결

### Deep Link가 작동하지 않는 경우

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

### 환경 변수가 로드되지 않는 경우

```bash
# 앱 재시작
npx expo start --clear
```

---

## 📝 TODO

- [ ] `.env` 파일 생성 및 API 키 입력
- [ ] 카카오 개발자 콘솔 설정
- [ ] 구글 클라우드 콘솔 설정
- [ ] 필수 패키지 설치
- [ ] 개발 빌드 생성 (Expo Go 대신)
- [ ] OAuth 로그인 테스트

완료! 🎉

