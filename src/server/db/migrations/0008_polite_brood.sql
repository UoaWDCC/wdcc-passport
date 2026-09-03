CREATE TYPE "public"."rarity" AS ENUM('common', 'rare', 'epic', 'legendary');--> statement-breakpoint
CREATE TABLE "card" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"rarity" "rarity" NOT NULL,
	"description" text NOT NULL,
	"image_path" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_card" (
	"user_id" text NOT NULL,
	"card_id" text NOT NULL,
	"quantity" integer NOT NULL,
	CONSTRAINT "user_card_user_id_card_id_pk" PRIMARY KEY("user_id","card_id")
);
--> statement-breakpoint
CREATE TABLE "userPack" (
	"user_id" text PRIMARY KEY NOT NULL,
	"pack_quantity" integer NOT NULL,
	CONSTRAINT "user_pack_quantity_check" CHECK ("userPack"."pack_quantity" >= 0)
);
--> statement-breakpoint
ALTER TABLE "user_card" ADD CONSTRAINT "user_card_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_card" ADD CONSTRAINT "user_card_card_id_card_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."card"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userPack" ADD CONSTRAINT "userPack_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;