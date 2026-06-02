-- CreateEnum
CREATE TYPE "NoticeKind" AS ENUM ('maintenance', 'feature', 'announcement', 'security', 'event');

-- CreateEnum
CREATE TYPE "ResourceCategory" AS ENUM ('manual', 'form', 'guide', 'contract_template', 'marketing', 'other');

-- CreateTable
CREATE TABLE "notices" (
    "id" TEXT NOT NULL,
    "kind" "NoticeKind" NOT NULL DEFAULT 'announcement',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "category" "ResourceCategory" NOT NULL DEFAULT 'other',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "file_key" TEXT,
    "file_name" TEXT,
    "external_url" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notices_pinned_published_at_idx" ON "notices"("pinned", "published_at");

-- CreateIndex
CREATE INDEX "notices_kind_published_at_idx" ON "notices"("kind", "published_at");

-- CreateIndex
CREATE INDEX "resources_category_published_at_idx" ON "resources"("category", "published_at");

-- CreateIndex
CREATE INDEX "resources_pinned_published_at_idx" ON "resources"("pinned", "published_at");
