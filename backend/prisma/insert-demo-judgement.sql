-- =====================================================
-- Judgement 데모 데이터 삽입
-- =====================================================
-- 설명: 아카이브에 대한 판정(judgement) 데모 데이터를 삽입합니다.
-- 
-- 데이터 정보:
-- - is_archive: true (아카이빙 판정)
-- - comment: 멋있는 빈티지네요!
-- - price: 1200000원
-- - member_id: 3497a0f8-e593-44dc-a4fb-537c58c3efb2
-- - archive_id: ffea90a7-0d2b-46df-a18b-cb1c5cb5ba8b
-- =====================================================

INSERT INTO judgement (
  id,
  is_archive,
  comment,
  price,
  member_id,
  archive_id,
  created_at
)
VALUES (
  gen_random_uuid(), -- id (UUID 자동 생성)
  true, -- is_archive
  '멋있는 빈티지네요!', -- comment
  1200000, -- price
  '3497a0f8-e593-44dc-a4fb-537c58c3efb2', -- member_id
  'ffea90a7-0d2b-46df-a18b-cb1c5cb5ba8b', -- archive_id
  NOW() -- created_at
)

-- =====================================================
-- 추가 데모 데이터 (옵션)
-- =====================================================
-- 다양한 판정을 위한 추가 데이터 (필요시 주석 해제)

-- 디-아카이빙 판정 예시
-- INSERT INTO judgement (
--   id,
--   is_archive,
--   comment,
--   price,
--   member_id,
--   archive_id,
--   created_at
-- )
-- VALUES (
--   gen_random_uuid(),
--   false, -- 디-아카이빙
--   '제 스타일은 아니네요',
--   800000,
--   '3497a0f8-e593-44dc-a4fb-537c58c3efb2',
--   'ffea90a7-0d2b-46df-a18b-cb1c5cb5ba8b',
--   NOW()
-- )
-- ON CONFLICT DO NOTHING;

-- 가격 판정만 있는 경우
-- INSERT INTO judgement (
--   id,
--   is_archive,
--   comment,
--   price,
--   member_id,
--   archive_id,
--   created_at
-- )
-- VALUES (
--   gen_random_uuid(),
--   true,
--   NULL, -- 코멘트 없음
--   1500000,
--   '3497a0f8-e593-44dc-a4fb-537c58c3efb2',
--   'ffea90a7-0d2b-46df-a18b-cb1c5cb5ba8b',
--   NOW()
-- )

