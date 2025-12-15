/*
  Warnings:

  - You are about to drop the column `email` on the `member` table. All the data in the column will be lost.
  - Added the required column `auth_user_id` to the `member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `member` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "member" DROP COLUMN "email",
ADD COLUMN     "auth_user_id" UUID NOT NULL,
ADD COLUMN     "role" VARCHAR(255) NOT NULL;

-- CreateTable
CREATE TABLE "auth_user" (
    "id" UUID NOT NULL,
    "provider" VARCHAR(255) NOT NULL,
    "provider_id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "auth_user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "member_auth_user_id_idx" ON "member"("auth_user_id");
