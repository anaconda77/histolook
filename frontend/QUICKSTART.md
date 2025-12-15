# NativeWind v4 - Quick Start 🚀

## ✅ 설치 완료

NativeWind v4와 Tailwind CSS가 성공적으로 설치 및 설정되었습니다!

## 📦 설치된 패키지

- `nativewind@4.2.1` - NativeWind v4
- `tailwindcss@3.3.2` - Tailwind CSS
- `lucide-react-native@0.561.0` - 아이콘 라이브러리
- `@types/react-native@0.72.8` - TypeScript 타입

## 🎯 바로 시작하기

### 1. 개발 서버 시작

```bash
cd frontend
npm start
```

### 2. 예제 컴포넌트 사용

`components/nativewind-example.tsx` 파일에 NativeWind 사용 예제가 있습니다.

화면에서 사용하려면:

```tsx
import NativeWindExample from '@/components/nativewind-example';

export default function Screen() {
  return <NativeWindExample />;
}
```

### 3. 기본 사용법

```tsx
import { View, Text } from 'react-native';
import { Heart } from 'lucide-react-native';

export default function MyComponent() {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
      <View className="bg-blue-500 rounded-xl p-6">
        <Heart size={32} color="white" />
        <Text className="text-white text-xl font-bold mt-2">
          Hello NativeWind!
        </Text>
      </View>
    </View>
  );
}
```

## 📚 상세 가이드

자세한 내용은 `NATIVEWIND_SETUP.md` 파일을 참고하세요.

## ⚡ 중요 사항

1. **StyleSheet 사용 금지** - 항상 `className` 사용
2. **다크 모드** - `dark:` 접두사로 다크 모드 스타일 지정
3. **아이콘** - `lucide-react-native` 사용
4. **타입 안전성** - TypeScript 완벽 지원

## 🔧 트러블슈팅

스타일이 적용되지 않으면 캐시를 클리어하세요:

```bash
npm start -- --clear
```

---

Happy coding! 🎨✨

