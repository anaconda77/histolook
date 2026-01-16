# EAS 계정 생성 가이드

## EAS란?

EAS (Expo Application Services)는 Expo의 클라우드 서비스로, 앱 빌드, 업데이트, 제출 등을 제공합니다. EAS 계정은 **Expo 계정**과 동일합니다.

## 계정 생성 방법

### 방법 1: 웹사이트에서 생성 (권장)

1. [Expo 웹사이트](https://expo.dev/) 접속
2. 우측 상단의 **"Sign Up"** 또는 **"Get Started"** 클릭
3. 다음 중 하나로 계정 생성:
   - **GitHub 계정으로 로그인** (권장)
   - **Google 계정으로 로그인**
   - **이메일로 가입**

#### GitHub 계정으로 로그인 (권장)

1. "Continue with GitHub" 클릭
2. GitHub 로그인 및 권한 승인
3. Expo 계정 자동 생성

#### Google 계정으로 로그인

1. "Continue with Google" 클릭
2. Google 계정 선택 및 로그인
3. Expo 계정 자동 생성

#### 이메일로 가입

1. 이메일 주소 입력
2. 비밀번호 설정
3. 이메일 인증
4. 계정 생성 완료

### 방법 2: CLI에서 생성

```bash
npm install -g eas-cli
eas login
```

이 명령어를 실행하면:
- 브라우저가 자동으로 열림
- Expo 웹사이트에서 로그인 또는 회원가입
- CLI에 자동으로 로그인됨

## 계정 생성 후 할 일

### 1. 프로젝트 초기화

```bash
cd frontend
eas init
```

이 명령어를 실행하면:
- Expo 계정에 프로젝트 연결
- Project ID 자동 생성
- `app.json`에 Project ID 자동 추가

### 2. Project ID 확인

프로젝트 초기화 후 `app.json` 파일을 확인:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      }
    }
  }
}
```

또는 Expo Dashboard에서 확인:
1. [Expo Dashboard](https://expo.dev/) 접속
2. 프로젝트 선택
3. Settings > Project ID 확인

## 무료 플랜 vs 유료 플랜

### 무료 플랜 (Free)

- ✅ 기본 빌드 기능
- ✅ 앱 업데이트 (OTA)
- ✅ 기본 분석
- ✅ Project ID 생성
- ⚠️ 빌드 시간 제한
- ⚠️ 월 빌드 횟수 제한

### 유료 플랜 (Production)

- ✅ 무제한 빌드
- ✅ 우선 빌드 큐
- ✅ 고급 분석
- ✅ 더 많은 기능

**현재 프로젝트에서는 무료 플랜으로 충분합니다.**

## 문제 해결

### 이미 Expo 계정이 있는 경우

```bash
cd frontend
eas login
```

기존 계정으로 로그인하면 됩니다.

### 계정이 여러 개인 경우

```bash
eas whoami
```

현재 로그인된 계정 확인

```bash
eas logout
eas login
```

다른 계정으로 로그인

### Project ID가 생성되지 않는 경우

1. `eas init` 명령어 재실행
2. 또는 Expo Dashboard에서 수동으로 프로젝트 생성
3. Settings에서 Project ID 확인 후 `app.json`에 수동 추가

## 다음 단계

계정 생성 후:

1. ✅ `eas init` 실행하여 프로젝트 연결
2. ✅ Project ID 확인
3. ✅ FCM 토큰 등록 테스트
4. ✅ 알림 전송 테스트

## 참고 자료

- [Expo 공식 문서](https://docs.expo.dev/)
- [EAS CLI 문서](https://docs.expo.dev/build/introduction/)
- [Expo Dashboard](https://expo.dev/)
