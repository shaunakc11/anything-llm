-- AlterTable
ALTER TABLE "file" ALTER COLUMN "pageContentUrl" DROP NOT NULL,
ALTER COLUMN "wordCount" DROP NOT NULL,
ALTER COLUMN "tokenCountEstimate" DROP NOT NULL;
