-- 아카이브 데모 데이터 삽입

INSERT INTO archive (
  id,
  brand_id,
  timeline_id,
  category_id,
  average_judgement_price,
  story,
  image_urls,
  is_judgement_allow,
  is_price_judgement_allow,
  author_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(), -- 자동으로 UUID 생성
  2, -- brand_id
  8, -- timeline_id (1980s)
  4, -- category_id
  1200000, -- average_judgement_price
  '빈티지라고 해서 모두가 가치있는 것일까요? 꼭 그렇지는 않을 것 입니다.', -- story
  ARRAY[
    'https://image.production.fruitsfamily.com/public/product/resized%40width1125/sBgMUURtIt-0D22CE3F-6C15-4AE5-8CC8-14027B36142F.jpg'
  ]::text[], -- image_urls (실제 빈티지 데님 이미지)
  true, -- is_judgement_allow
  true, -- is_price_judgement_allow
  '13591192-9db8-448a-b744-bf4413539886', -- author_id
  NOW(), -- created_at
  NOW() -- updated_at
)

INSERT INTO archive (
  id,
  brand_id,
  timeline_id,
  category_id,
  average_judgement_price,
  story,
  image_urls,
  is_judgement_allow,
  is_price_judgement_allow,
  author_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(), -- 자동으로 UUID 생성
  3, -- brand_id
  9, -- timeline_id (1990s)
  2, -- category_id
  500000, -- average_judgement_price
  '칼하트에서 현재 가장 하입받는 제품에 대해 소개하고자 합니다. 해당 제품은 J97 모스그린으로 빈티지하면서 박시한 실루엣이 매력적인 아우터입니다.', -- story
  ARRAY[
    'https://image.production.fruitsfamily.com/public/product/resized%40width1125/fISrnKfqL4-C2AE0D4E-74F9-48BC-8039-AFFCE9C76641.jpg'
  ]::text[], -- image_urls (실제 빈티지 데님 이미지)
  true, -- is_judgement_allow
  true, -- is_price_judgement_allow
  '13591192-9db8-448a-b744-bf4413539886', -- author_id
  NOW(), -- created_at
  NOW() -- updated_at
)