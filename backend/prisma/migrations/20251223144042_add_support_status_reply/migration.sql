-- AlterTable
-- Add status and reply columns to support_post table
ALTER TABLE "support_post" ADD COLUMN "status" VARCHAR(50) NOT NULL DEFAULT '대기중';
ALTER TABLE "support_post" ADD COLUMN "reply" TEXT;

