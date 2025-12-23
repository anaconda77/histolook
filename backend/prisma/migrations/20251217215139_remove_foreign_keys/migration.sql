-- Drop all foreign key constraints
-- This migration removes all physical foreign key constraints from the database
-- Relations will be managed at the Prisma application level (relationMode = "prisma")

-- Drop foreign keys from archive table
ALTER TABLE "archive" DROP CONSTRAINT IF EXISTS "archive_brand_id_fkey";
ALTER TABLE "archive" DROP CONSTRAINT IF EXISTS "archive_timeline_id_fkey";
ALTER TABLE "archive" DROP CONSTRAINT IF EXISTS "archive_category_id_fkey";
ALTER TABLE "archive" DROP CONSTRAINT IF EXISTS "archive_author_id_fkey";

-- Drop foreign keys from archive_interest table
ALTER TABLE "archive_interest" DROP CONSTRAINT IF EXISTS "archive_interest_archive_id_fkey";
ALTER TABLE "archive_interest" DROP CONSTRAINT IF EXISTS "archive_interest_member_id_fkey";

-- Drop foreign keys from judgement table
ALTER TABLE "judgement" DROP CONSTRAINT IF EXISTS "judgement_member_id_fkey";
ALTER TABLE "judgement" DROP CONSTRAINT IF EXISTS "judgement_archive_id_fkey";

-- Drop foreign keys from support_post table
ALTER TABLE "support_post" DROP CONSTRAINT IF EXISTS "support_post_member_id_fkey";

-- Drop foreign keys from alarm table
ALTER TABLE "alarm" DROP CONSTRAINT IF EXISTS "alarm_member_id_fkey";

-- Drop foreign keys from member table
ALTER TABLE "member" DROP CONSTRAINT IF EXISTS "member_auth_user_id_fkey";



