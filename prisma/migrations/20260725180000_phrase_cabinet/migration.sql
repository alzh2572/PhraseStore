-- AlterTable: кабинет — isPublic / isFavorite, category опциональна
ALTER TABLE "Phrase" ADD COLUMN IF NOT EXISTS "isFavorite" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Phrase" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Phrase" SET "isPublic" = true WHERE "visibility" = 'PUBLIC';
UPDATE "Phrase" SET "isPublic" = false WHERE "visibility" = 'PRIVATE';

ALTER TABLE "Phrase" ALTER COLUMN "categoryId" DROP NOT NULL;

ALTER TABLE "Phrase" DROP CONSTRAINT IF EXISTS "Phrase_categoryId_fkey";
ALTER TABLE "Phrase" ADD CONSTRAINT "Phrase_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Phrase_isPublic_createdAt_idx" ON "Phrase"("isPublic", "createdAt");
CREATE INDEX IF NOT EXISTS "Phrase_ownerId_isFavorite_idx" ON "Phrase"("ownerId", "isFavorite");
