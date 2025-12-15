# NativeWind v4 Setup Guide

## 설치 완료 항목

✅ NativeWind v4.2.1 설치 완료
✅ Tailwind CSS v3.3.2 설치 완료
✅ TypeScript 타입 정의 설치 완료
✅ 모든 설정 파일 생성 완료

## 디렉토리 구조

```
frontend/
├── app/
│   └── _layout.tsx              # global.css import 추가됨
├── components/
│   └── nativewind-example.tsx   # NativeWind 사용 예제
├── babel.config.js              # NativeWind babel 설정
├── metro.config.js              # Metro bundler 설정
├── tailwind.config.js           # Tailwind CSS 설정
├── global.css                   # Tailwind 지시문
├── nativewind-env.d.ts          # TypeScript 타입 선언
├── tsconfig.json                # nativewind-env.d.ts 포함
└── app.json                     # nativewind/metro 플러그인 추가
```

## 설정 파일 설명

### 1. `tailwind.config.js`
Tailwind CSS 설정 파일입니다. 커스텀 색상, 폰트 등을 여기서 설정할 수 있습니다.

```javascript
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: { /* 커스텀 색상 */ },
      },
    },
  },
};
```

### 2. `babel.config.js`
NativeWind를 위한 Babel 설정입니다.

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
```

### 3. `metro.config.js`
Metro bundler가 CSS 파일을 처리하도록 설정합니다.

```javascript
const { withNativeWind } = require('nativewind/metro');
module.exports = withNativeWind(config, { input: './global.css' });
```

### 4. `nativewind-env.d.ts`
TypeScript에서 `className` prop을 사용할 수 있도록 타입을 선언합니다.

### 5. `global.css`
Tailwind CSS 지시문이 포함된 파일로, `app/_layout.tsx`에서 import됩니다.

## 사용 방법

### 기본 사용법

StyleSheet 대신 `className` prop을 사용하세요:

```tsx
import { View, Text } from 'react-native';

export default function MyComponent() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-blue-500">
        Hello NativeWind!
      </Text>
    </View>
  );
}
```

### 다크 모드 지원

`dark:` 접두사를 사용하면 다크 모드에서 다른 스타일을 적용할 수 있습니다:

```tsx
<View className="bg-white dark:bg-gray-900">
  <Text className="text-black dark:text-white">
    Dark mode text
  </Text>
</View>
```

### 반응형 디자인

```tsx
<View className="w-full sm:w-1/2 lg:w-1/3">
  <Text>Responsive width</Text>
</View>
```

### 커스텀 색상 사용

`tailwind.config.js`에 정의된 커스텀 색상을 사용할 수 있습니다:

```tsx
<View className="bg-primary-500">
  <Text className="text-primary-50">Custom color</Text>
</View>
```

### 조건부 스타일링

```tsx
import { View, Text } from 'react-native';

export default function ConditionalStyles({ isActive }: { isActive: boolean }) {
  return (
    <View className={`p-4 ${isActive ? 'bg-green-500' : 'bg-gray-500'}`}>
      <Text className="text-white">Status</Text>
    </View>
  );
}
```

## 예제 컴포넌트

`components/nativewind-example.tsx` 파일을 참고하세요. 이 파일은 NativeWind의 다양한 기능을 보여주는 예제입니다.

사용 방법:

```tsx
import NativeWindExample from '@/components/nativewind-example';

export default function Screen() {
  return <NativeWindExample />;
}
```

## 유용한 Tailwind CSS 클래스

### 레이아웃
- `flex`, `flex-1`, `flex-row`, `flex-col`
- `items-center`, `items-start`, `items-end`
- `justify-center`, `justify-between`, `justify-around`
- `p-4` (padding), `m-4` (margin)
- `gap-2`, `space-x-4`, `space-y-2`

### 텍스트
- `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`
- `font-normal`, `font-semibold`, `font-bold`
- `text-center`, `text-left`, `text-right`
- `text-white`, `text-black`, `text-gray-500`

### 배경 & 테두리
- `bg-white`, `bg-blue-500`, `bg-transparent`
- `rounded`, `rounded-lg`, `rounded-full`
- `border`, `border-2`, `border-gray-300`
- `shadow`, `shadow-lg`

### 크기
- `w-full`, `w-1/2`, `w-screen`
- `h-full`, `h-screen`, `h-64`
- `min-h-screen`, `max-w-lg`

## 주의사항

1. **StyleSheet 사용 금지**: 프로젝트 규칙에 따라 `StyleSheet.create()`는 사용하지 않고 항상 NativeWind의 `className`을 사용하세요.

2. **Dev Server 재시작**: 설정 변경 후에는 개발 서버를 재시작하세요:
   ```bash
   npm start -- --clear
   ```

3. **Tailwind 클래스 자동완성**: VSCode를 사용하는 경우 "Tailwind CSS IntelliSense" 확장을 설치하면 자동완성이 됩니다.

4. **캐시 클리어**: 스타일이 적용되지 않으면 캐시를 클리어하세요:
   ```bash
   npm start -- --clear
   # 또는
   npx expo start -c
   ```

## 트러블슈팅

### className이 작동하지 않는 경우
1. `global.css`가 `app/_layout.tsx`에 import되어 있는지 확인
2. `babel.config.js`가 올바르게 설정되어 있는지 확인
3. 개발 서버를 재시작 (`npm start -- --clear`)

### TypeScript 오류가 발생하는 경우
1. `nativewind-env.d.ts` 파일이 존재하는지 확인
2. `tsconfig.json`의 `include`에 `nativewind-env.d.ts`가 포함되어 있는지 확인
3. VSCode를 재시작하거나 TypeScript 서버를 재시작

### 스타일이 적용되지 않는 경우
1. 해당 파일이 `tailwind.config.js`의 `content` 배열에 포함되어 있는지 확인
2. Metro bundler 캐시 클리어
3. node_modules 삭제 후 재설치

## 추가 리소스

- NativeWind 공식 문서: https://www.nativewind.dev/
- Tailwind CSS 공식 문서: https://tailwindcss.com/docs
- NativeWind v4 마이그레이션 가이드: https://www.nativewind.dev/v4/overview

