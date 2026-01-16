ALTER TABLE "archive" ADD COLUMN "judgement_cnt" BIGINT NOT NULL DEFAULT 0;

-- 기존 데이터의 judgement_cnt를 0으로 설정 (NULL이거나 다른 값인 경우)
UPDATE "archive" SET "judgement_cnt" = 0 WHERE "judgement_cnt" IS NULL OR "judgement_cnt" != 0;
