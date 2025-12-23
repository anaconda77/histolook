-- AlterTable
-- Add access_token and refresh_token columns to auth_user table
ALTER TABLE "auth_user" ADD COLUMN "access_token" TEXT;
ALTER TABLE "auth_user" ADD COLUMN "refresh_token" TEXT;

