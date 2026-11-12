ALTER TABLE "users" DROP CONSTRAINT "users_security_pair_check";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "pin_hash";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "security_question";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "security_answer_hash";