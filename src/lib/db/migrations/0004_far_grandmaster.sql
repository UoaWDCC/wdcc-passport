ALTER TABLE "event" ADD COLUMN "start_timestamp" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "end_timestamp" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_timestamps_check" CHECK ("event"."end_timestamp" > "event"."start_timestamp");