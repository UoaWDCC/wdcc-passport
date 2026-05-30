DROP TABLE "admin_of" CASCADE;--> statement-breakpoint
DROP TABLE "club" CASCADE;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;