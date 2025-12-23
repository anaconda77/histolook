/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `brand` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[kr_name]` on the table `brand` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nickname]` on the table `member` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[auth_user_id]` on the table `member` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "archive" ADD COLUMN     "image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "auth_user" ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "brand_name_key" ON "brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "brand_kr_name_key" ON "brand"("kr_name");

-- CreateIndex
CREATE UNIQUE INDEX "member_nickname_key" ON "member"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "member_auth_user_id_key" ON "member"("auth_user_id");
