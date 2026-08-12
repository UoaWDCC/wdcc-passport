ALTER TABLE "event" ADD COLUMN "start_timestamp" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "end_timestamp" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "qr_code_uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "six_digit_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_qr_code_uuid_unique" UNIQUE("qr_code_uuid");--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_six_digit_code_unique" UNIQUE("six_digit_code");--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_end_after_start_check" CHECK ("event"."end_timestamp" > "event"."start_timestamp");--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_six_digit_code_check" CHECK ("event"."six_digit_code" ~ '^[A-Z0-9]{6}$');