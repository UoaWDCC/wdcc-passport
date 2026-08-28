ALTER TABLE "badge" ADD COLUMN "code" text;--> statement-breakpoint
ALTER TABLE "badge" ADD CONSTRAINT "badge_code_unique" UNIQUE("code");