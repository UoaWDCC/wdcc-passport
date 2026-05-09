CREATE TABLE "cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text,
	"image_url" text,
	"event_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_collection" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"card_id" integer NOT NULL,
	"obtained_at" timestamp with time zone DEFAULT now() NOT NULL,
	"from_pack" integer
);
--> statement-breakpoint
CREATE TABLE "user_pack_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"pack_id" integer NOT NULL,
	"card_id" integer NOT NULL,
	"slot" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_packs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"event_id" integer,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"opened_at" timestamp with time zone,
	"scan_token" text NOT NULL,
	CONSTRAINT "user_packs_scan_token_unique" UNIQUE("scan_token")
);
--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_collection" ADD CONSTRAINT "user_collection_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_collection" ADD CONSTRAINT "user_collection_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_collection" ADD CONSTRAINT "user_collection_from_pack_user_packs_id_fk" FOREIGN KEY ("from_pack") REFERENCES "public"."user_packs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_pack_cards" ADD CONSTRAINT "user_pack_cards_pack_id_user_packs_id_fk" FOREIGN KEY ("pack_id") REFERENCES "public"."user_packs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_pack_cards" ADD CONSTRAINT "user_pack_cards_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_packs" ADD CONSTRAINT "user_packs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_packs" ADD CONSTRAINT "user_packs_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;