-- AlterTable
-- Add is_judgement_allow and is_price_judgement_allow columns to archive table
ALTER TABLE "archive" ADD COLUMN "is_judgement_allow" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "archive" ADD COLUMN "is_price_judgement_allow" BOOLEAN NOT NULL DEFAULT false;

