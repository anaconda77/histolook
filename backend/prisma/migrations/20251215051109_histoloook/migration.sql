-- CreateTable
CREATE TABLE "brand" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "kr_name" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "kr_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "nickname" VARCHAR(255) NOT NULL,
    "image_url" VARCHAR(255),
    "brand_interests" VARCHAR(255) NOT NULL,
    "secession_reason" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archive" (
    "id" UUID NOT NULL,
    "brand_id" BIGINT NOT NULL,
    "timeline_id" BIGINT NOT NULL,
    "category_id" BIGINT NOT NULL,
    "average_judgement_price" BIGINT,
    "story" TEXT NOT NULL,
    "author_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "archive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archive_interest" (
    "id" UUID NOT NULL,
    "archive_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "archive_interest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "judgement" (
    "id" UUID NOT NULL,
    "is_archive" BOOLEAN NOT NULL,
    "comment" TEXT,
    "price" BIGINT,
    "member_id" UUID NOT NULL,
    "archive_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "judgement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_post" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "support_type" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "member_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alarm" (
    "id" UUID NOT NULL,
    "alarm_type" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "is_global" BOOLEAN NOT NULL,
    "member_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alarm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "archive_brand_id_idx" ON "archive"("brand_id");

-- CreateIndex
CREATE INDEX "archive_timeline_id_idx" ON "archive"("timeline_id");

-- CreateIndex
CREATE INDEX "archive_category_id_idx" ON "archive"("category_id");

-- CreateIndex
CREATE INDEX "archive_author_id_idx" ON "archive"("author_id");

-- CreateIndex
CREATE INDEX "archive_interest_archive_id_idx" ON "archive_interest"("archive_id");

-- CreateIndex
CREATE INDEX "archive_interest_member_id_idx" ON "archive_interest"("member_id");

-- CreateIndex
CREATE INDEX "judgement_member_id_idx" ON "judgement"("member_id");

-- CreateIndex
CREATE INDEX "judgement_archive_id_idx" ON "judgement"("archive_id");

-- CreateIndex
CREATE INDEX "support_post_member_id_idx" ON "support_post"("member_id");

-- CreateIndex
CREATE INDEX "alarm_member_id_idx" ON "alarm"("member_id");
