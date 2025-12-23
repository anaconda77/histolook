-- AlterTable
-- Add title, image_url, and resource_path columns to alarm table
ALTER TABLE "alarm" ADD COLUMN "title" VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE "alarm" ADD COLUMN "image_url" VARCHAR(500);
ALTER TABLE "alarm" ADD COLUMN "resource_path" VARCHAR(500);

