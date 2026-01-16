# Firebase Console 앱 추가 가이드

## 현재 프로젝트 구조

현재 프로젝트는 **Expo Notifications**를 사용하므로, Firebase Console에서 앱을 추가할 필요가 **없습니다**.

- **백엔드**: Firebase Admin SDK 사용 (서비스 계정 키만 필요)
- **프론트엔드**: Expo Notifications 사용 (Firebase Web SDK 불필요)

## 만약 Firebase를 직접 사용해야 한다면

### iOS 앱 추가

1. Firebase Console > 프로젝트 설정 > 내 앱 > iOS 앱 추가
2. **번들 ID**: `com.histolook.app` (app.json의 `ios.bundleIdentifier`)
3. 앱 닉네임: `HistoLook iOS` (선택사항)
4. App Store ID: (선택사항, 나중에 추가 가능)

**필요한 파일**:
- `GoogleService-Info.plist` 다운로드
- `ios/` 폴더에 추가 (네이티브 빌드 시)

### Android 앱 추가

1. Firebase Console > 프로젝트 설정 > 내 앱 > Android 앱 추가
2. **패키지 이름**: `com.histolook.app` (app.json의 `android.package`)
3. 앱 닉네임: `HistoLook Android` (선택사항)
4. SHA-1 인증서 지문: (선택사항, 나중에 추가 가능)

**필요한 파일**:
- `google-services.json` 다운로드
- `android/app/` 폴더에 추가 (네이티브 빌드 시)

## 현재 구현에서는 불필요

현재 구현은 **Expo Notifications**를 사용하므로:
- ✅ Firebase Console에서 앱 추가 불필요
- ✅ `GoogleService-Info.plist` 또는 `google-services.json` 불필요
- ✅ Firebase Web SDK 초기화 불필요

**필요한 것**:
- ✅ 백엔드: Firebase 서비스 계정 키 (서버 사이드 알림 전송용)
- ✅ 프론트엔드: Expo Project ID (Expo Push Notification 서비스용)

## Expo Notifications vs Firebase 직접 사용

### 현재 방식 (Expo Notifications) - 권장
- ✅ 설정이 간단함
- ✅ Expo가 FCM을 자동으로 처리
- ✅ Firebase Console에서 앱 추가 불필요
- ✅ 크로스 플랫폼 지원

### Firebase 직접 사용
- ❌ 네이티브 빌드 필요
- ❌ iOS/Android 각각 설정 필요
- ❌ `GoogleService-Info.plist`, `google-services.json` 필요
- ❌ 더 복잡한 설정

## 결론

**현재 구현에서는 Firebase Console에서 앱을 추가할 필요가 없습니다.**

백엔드에서 Firebase Admin SDK를 사용하여 알림을 전송하고, 프론트엔드는 Expo Notifications를 통해 알림을 수신합니다.
