UPDATE "badge" SET "code" = substr(md5(random()::text), 1, 6) WHERE "code" IS NULL;--> statement-breakpoint
ALTER TABLE "badge" ALTER COLUMN "code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "badge" ADD CONSTRAINT "badge_event_id_unique" UNIQUE("event_id");
