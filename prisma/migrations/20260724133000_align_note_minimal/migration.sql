-- Align Note with minimal schema (id, title, createdAt)
ALTER TABLE "Note" DROP CONSTRAINT IF EXISTS "Note_ownerId_fkey";
ALTER TABLE "Note" DROP COLUMN IF EXISTS "ownerId";
