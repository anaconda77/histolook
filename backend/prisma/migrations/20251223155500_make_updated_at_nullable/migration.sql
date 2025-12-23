-- Make updated_at nullable for Brand, Timeline, Category
ALTER TABLE "brand" ALTER COLUMN "updated_at" DROP NOT NULL;
ALTER TABLE "timeline" ALTER COLUMN "updated_at" DROP NOT NULL;
ALTER TABLE "category" ALTER COLUMN "updated_at" DROP NOT NULL;

