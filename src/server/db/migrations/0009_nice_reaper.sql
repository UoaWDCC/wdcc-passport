ALTER TABLE "user_card" ADD COLUMN "acquired_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "card" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "user_card" DROP COLUMN "quantity";