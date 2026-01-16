-- CreateTable
CREATE TABLE "device_token" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "device_id" VARCHAR(255),
    "platform" VARCHAR(50) NOT NULL,
    "member_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "device_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_token_token_key" ON "device_token"("token");

-- CreateIndex
CREATE INDEX "device_token_member_id_idx" ON "device_token"("member_id");

-- CreateIndex
CREATE INDEX "device_token_token_idx" ON "device_token"("token");

-- AddForeignKey
ALTER TABLE "device_token" ADD CONSTRAINT "device_token_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
