-- AlterTable
ALTER TABLE "device_token" ADD COLUMN IF NOT EXISTS "notification_enabled" BOOLEAN NOT NULL DEFAULT true;
