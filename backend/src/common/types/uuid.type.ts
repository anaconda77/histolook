/**
 * UUID 타입 정의
 * 
 * UUID 형식의 문자열을 명시적으로 표현하기 위한 타입 alias
 * RFC 4122 표준 UUID (예: 550e8400-e29b-41d4-a716-446655440000)
 */
export type UUID = string;

/**
 * UUID 타입 가드
 * 주어진 문자열이 UUID 형식인지 검증
 */
export function isUUID(value: string): value is UUID {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

