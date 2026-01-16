-- 모든 외래키 제약 조건 제거

-- member 테이블
DO $$
BEGIN
  -- member -> auth_user
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'member_auth_user_id_fkey' 
    AND table_name = 'member'
  ) THEN
    ALTER TABLE "member" DROP CONSTRAINT "member_auth_user_id_fkey";
  END IF;
END $$;

-- archive 테이블
DO $$
BEGIN
  -- archive -> brand
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'archive_brand_id_fkey' 
    AND table_name = 'archive'
  ) THEN
    ALTER TABLE "archive" DROP CONSTRAINT "archive_brand_id_fkey";
  END IF;

  -- archive -> timeline
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'archive_timeline_id_fkey' 
    AND table_name = 'archive'
  ) THEN
    ALTER TABLE "archive" DROP CONSTRAINT "archive_timeline_id_fkey";
  END IF;

  -- archive -> category
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'archive_category_id_fkey' 
    AND table_name = 'archive'
  ) THEN
    ALTER TABLE "archive" DROP CONSTRAINT "archive_category_id_fkey";
  END IF;

  -- archive -> member (author)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'archive_author_id_fkey' 
    AND table_name = 'archive'
  ) THEN
    ALTER TABLE "archive" DROP CONSTRAINT "archive_author_id_fkey";
  END IF;
END $$;

-- archive_interest 테이블
DO $$
BEGIN
  -- archive_interest -> archive
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'archive_interest_archive_id_fkey' 
    AND table_name = 'archive_interest'
  ) THEN
    ALTER TABLE "archive_interest" DROP CONSTRAINT "archive_interest_archive_id_fkey";
  END IF;

  -- archive_interest -> member
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'archive_interest_member_id_fkey' 
    AND table_name = 'archive_interest'
  ) THEN
    ALTER TABLE "archive_interest" DROP CONSTRAINT "archive_interest_member_id_fkey";
  END IF;
END $$;

-- judgement 테이블
DO $$
BEGIN
  -- judgement -> member
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'judgement_member_id_fkey' 
    AND table_name = 'judgement'
  ) THEN
    ALTER TABLE "judgement" DROP CONSTRAINT "judgement_member_id_fkey";
  END IF;

  -- judgement -> archive
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'judgement_archive_id_fkey' 
    AND table_name = 'judgement'
  ) THEN
    ALTER TABLE "judgement" DROP CONSTRAINT "judgement_archive_id_fkey";
  END IF;
END $$;

-- support_post 테이블
DO $$
BEGIN
  -- support_post -> member
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'support_post_member_id_fkey' 
    AND table_name = 'support_post'
  ) THEN
    ALTER TABLE "support_post" DROP CONSTRAINT "support_post_member_id_fkey";
  END IF;
END $$;

-- device_token 테이블
DO $$
BEGIN
  -- device_token -> member
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'device_token_member_id_fkey' 
    AND table_name = 'device_token'
  ) THEN
    ALTER TABLE "device_token" DROP CONSTRAINT "device_token_member_id_fkey";
  END IF;
END $$;
