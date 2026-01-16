# Firebase Console iOS 앱 추가 가이드

## 사전 준비

프로젝트 정보 확인:
- **번들 ID**: `com.histolook.app` (app.json의 `ios.bundleIdentifier`)
- **앱 이름**: `HistoLook`

## 단계별 가이드

### 1단계: Firebase Console 접속

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 로그인 (Google 계정)
3. 프로젝트 선택 또는 새 프로젝트 생성

### 2단계: iOS 앱 추가

1. Firebase Console에서 프로젝트 선택
2. 프로젝트 개요 페이지에서 **"iOS 앱 추가"** 버튼 클릭
   - 또는 프로젝트 설정(톱니바퀴 아이콘) > 프로젝트 설정 > 내 앱 > iOS 앱 추가

### 3단계: 앱 정보 입력

다음 정보를 입력합니다:

#### 필수 정보

1. **iOS 번들 ID**
   ```
   com.histolook.app
   ```
   - app.json의 `ios.bundleIdentifier` 값
   - 이 값은 고유해야 하며, App Store에 등록할 때도 사용됩니다

2. **앱 닉네임** (선택사항)
   ```
   HistoLook iOS
   ```
   - Firebase Console에서 구분하기 위한 이름
   - 나중에 변경 가능

3. **App Store ID** (선택사항)
   - App Store에 앱이 등록되어 있으면 입력
   - 나중에 추가 가능

### 4단계: GoogleService-Info.plist 다운로드

1. "앱 등록" 버튼 클릭
2. `GoogleService-Info.plist` 파일이 자동으로 다운로드됩니다
3. 이 파일을 안전하게 보관하세요

### 5단계: GoogleService-Info.plist 파일 구조

다운로드된 파일의 내용 예시:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>API_KEY</key>
	<string>AIza...</string>
	<key>GCM_SENDER_ID</key>
	<string>123456789</string>
	<key>PLIST_VERSION</key>
	<string>1</string>
	<key>BUNDLE_ID</key>
	<string>com.histolook.app</string>
	<key>PROJECT_ID</key>
	<string>your-project-id</string>
	<key>STORAGE_BUCKET</key>
	<string>your-project-id.appspot.com</string>
	<key>IS_ADS_ENABLED</key>
	<false/>
	<key>IS_ANALYTICS_ENABLED</key>
	<false/>
	<key>IS_APPINVITE_ENABLED</key>
	<true/>
	<key>IS_GCM_ENABLED</key>
	<true/>
	<key>IS_SIGNIN_ENABLED</key>
	<true/>
	<key>GOOGLE_APP_ID</key>
	<string>1:123456789:ios:abcdef123456</string>
</dict>
</plist>
```

### 6단계: Expo 프로젝트에 파일 추가

#### 방법 1: Expo Config Plugin 사용 (권장)

`app.json`에 다음 설정 추가:

```json
{
  "expo": {
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "plugins": [
      [
        "@react-native-firebase/app",
        {
          "ios": {
            "googleServicesFile": "./GoogleService-Info.plist"
          }
        }
      ]
    ]
  }
}
```

#### 방법 2: 네이티브 빌드 시 수동 추가

1. `GoogleService-Info.plist` 파일을 프로젝트 루트에 저장
2. 네이티브 빌드 시 `ios/` 폴더에 복사
3. Xcode에서 프로젝트 열기
4. `GoogleService-Info.plist`를 Xcode 프로젝트에 드래그 앤 드롭
5. "Copy items if needed" 체크
6. Target: `HistoLook` 선택

### 7단계: Firebase SDK 설치 (필요한 경우)

현재 프로젝트는 Expo Notifications를 사용하므로 **필요하지 않습니다**.

만약 Firebase를 직접 사용해야 한다면:

```bash
cd frontend
npx expo install @react-native-firebase/app @react-native-firebase/messaging
```

### 8단계: 설정 확인

1. Firebase Console > 프로젝트 설정 > 내 앱
2. iOS 앱이 목록에 표시되는지 확인
3. 앱 아이콘 옆에 체크마크가 표시되면 정상

### 9단계: 추가 설정 (선택사항)

#### APNs 인증 키 설정 (푸시 알림용)

1. Firebase Console > 프로젝트 설정 > 클라우드 메시징
2. "Apple 앱 구성" 섹션
3. APNs 인증 키 업로드:
   - Apple Developer Console에서 APNs 인증 키 생성
   - `.p8` 파일 다운로드
   - Key ID와 Team ID 확인
   - Firebase Console에 업로드

#### APNs 인증 키 생성 방법

1. [Apple Developer](https://developer.apple.com/account/) 접속
2. Certificates, Identifiers & Profiles > Keys
3. "+" 버튼 클릭
4. Key Name 입력 (예: "HistoLook APNs Key")
5. "Apple Push Notifications service (APNs)" 체크
6. Continue > Register
7. `.p8` 파일 다운로드 (한 번만 다운로드 가능)
8. Key ID 기록

## 중요 사항

### 현재 프로젝트에서는 불필요

현재 프로젝트는 **Expo Notifications**를 사용하므로:
- ✅ Firebase Console에서 iOS 앱 추가 **불필요**
- ✅ `GoogleService-Info.plist` 파일 **불필요**
- ✅ APNs 인증 키 설정 **불필요**

Expo가 FCM을 자동으로 처리합니다.

### Firebase를 직접 사용해야 하는 경우에만

다음 경우에만 iOS 앱을 추가하세요:
- Firebase Analytics 사용
- Firebase Authentication 사용
- Firebase를 직접 사용하는 다른 기능 사용
- 네이티브 빌드 사용

## 문제 해결

### 번들 ID가 이미 사용 중인 경우

- 다른 Firebase 프로젝트에 이미 등록되어 있을 수 있습니다
- 해당 프로젝트에서 삭제하거나 다른 번들 ID 사용

### GoogleService-Info.plist 파일을 잃어버린 경우

1. Firebase Console > 프로젝트 설정 > 내 앱
2. iOS 앱 선택
3. "GoogleService-Info.plist 다운로드" 클릭

### 앱이 목록에 표시되지 않는 경우

1. 페이지 새로고침
2. 다른 Firebase 프로젝트에 있는지 확인
3. 브라우저 캐시 삭제

## 다음 단계

iOS 앱 추가 후:
1. Android 앱도 추가 (동일한 프로젝트에)
2. 백엔드에서 Firebase Admin SDK 설정 확인
3. 알림 전송 테스트
