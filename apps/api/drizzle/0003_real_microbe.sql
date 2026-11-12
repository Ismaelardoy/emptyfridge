ALTER TABLE "users" ADD COLUMN "recovery_code_hash" text;--> statement-breakpoint
CREATE UNIQUE INDEX "users_recovery_code_hash" ON "users" USING btree ("recovery_code_hash");