# iOS 실물 기기에서 테스트하기

FCM(푸시 알림) 기능을 테스트하려면 실물 iOS 기기가 필요합니다. iOS 시뮬레이터는 푸시 알림을 지원하지 않습니다.

## 사전 준비

1. **Apple Developer 계정** (무료 계정도 가능)
2. **실물 iOS 기기** (iPhone 또는 iPad)
3. **USB 케이블**로 Mac에 연결
4. **Xcode** 설치 (App Store에서 다운로드)

## 방법 1: EAS Build로 Development Build 생성 (권장)

### 1단계: EAS CLI 설치 및 로그인

```bash
# EAS CLI 전역 설치 (아직 안 했다면)
npm install -g eas-cli

# EAS 로그인
eas login
```

### 2단계: Development Build 생성

```bash
cd frontend

# iOS Development Build 생성
eas build --profile development --platform ios
```

빌드가 완료되면 QR 코드가 표시됩니다.

### 3단계: 실물 기기에 설치

**옵션 A: TestFlight 사용 (권장)**
1. 빌드 완료 후 EAS 대시보드에서 TestFlight 링크 확인
2. TestFlight 앱을 통해 설치

**옵션 B: 직접 설치**
1. 빌드 완료 후 다운로드 링크 확인
2. Safari에서 링크 열기
3. "설치" 버튼 탭

### 4단계: 개발 서버 연결

```bash
# 개발 서버 시작
cd frontend
npx expo start --dev-client
```

앱을 열면 개발 서버에 자동으로 연결됩니다.

## 방법 2: 로컬에서 Development Build 생성 (고급)

### 1단계: Xcode 프로젝트 생성

```bash
cd frontend

# iOS 네이티브 프로젝트 생성
npx expo prebuild --platform ios
```

### 2단계: Xcode에서 열기

```bash
open ios/histolook.xcworkspace
```

### 3단계: Xcode에서 설정

1. **프로젝트 선택**: 왼쪽 네비게이터에서 `histolook` 프로젝트 선택
2. **Signing & Capabilities** 탭:
   - **Team**: Apple Developer 계정 선택
   - **Bundle Identifier**: `com.histolook.app` 확인
3. **실물 기기 선택**: 상단 툴바에서 연결된 기기 선택
4. **빌드 및 실행**: `Cmd + R` 또는 ▶️ 버튼 클릭

### 4단계: 개발 서버 연결

Xcode에서 앱이 실행되면, 터미널에서:

```bash
cd frontend
npx expo start --dev-client
```

앱이 자동으로 개발 서버에 연결됩니다.

## 방법 3: Expo Go 사용 (FCM 미지원)

⚠️ **주의**: Expo Go는 FCM을 지원하지 않으므로 푸시 알림 기능을 테스트할 수 없습니다.

```bash
cd frontend
npx expo start
```

실물 기기에서 Expo Go 앱을 열고 QR 코드를 스캔하세요.

## 문제 해결

### "No devices found" 오류

1. 기기가 Mac에 연결되어 있는지 확인
2. 기기에서 "이 컴퓨터를 신뢰하시겠습니까?" 팝업이 나타나면 "신뢰" 선택
3. Xcode > Window > Devices and Simulators에서 기기 인식 확인

### "Signing for ... requires a development team" 오류

1. Xcode에서 프로젝트 열기
2. Signing & Capabilities 탭에서 Team 선택
3. Apple Developer 계정 추가 (없다면 무료 계정 생성 가능)

### 빌드 실패

```bash
# 캐시 정리 후 재시도
cd frontend
rm -rf ios android
npx expo prebuild --clean
```

### 개발 서버 연결 안 됨

1. Mac과 기기가 같은 Wi-Fi 네트워크에 연결되어 있는지 확인
2. 방화벽 설정 확인
3. `npx expo start --tunnel` 사용 (느리지만 안정적)

## FCM 테스트 체크리스트

✅ 실물 iOS 기기에서 앱 실행  
✅ 로그인 성공  
✅ 콘솔에서 "Expo Push Token: ..." 메시지 확인  
✅ 콘솔에서 "FCM token registered successfully" 메시지 확인  
✅ 백엔드 DB에서 `device_token` 테이블에 토큰 저장 확인  
✅ 푸시 알림 수신 테스트

## 참고

- Development Build는 네이티브 모듈을 포함하므로 첫 빌드에 시간이 걸립니다 (10-20분)
- 이후 코드 변경은 Hot Reload로 즉시 반영됩니다
- 네이티브 코드 변경 시에만 다시 빌드가 필요합니다
