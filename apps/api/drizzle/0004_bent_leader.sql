ALTER TABLE "sessions" ALTER COLUMN "expires_at" DROP NOT NULL;--> statement-breakpoint
-- Las sesiones existentes pasan a no caducar.
UPDATE "sessions" SET "expires_at" = NULL WHERE "expires_at" IS NOT NULL;
