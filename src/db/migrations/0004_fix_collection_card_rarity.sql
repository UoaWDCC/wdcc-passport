ALTER TABLE "cards" ADD COLUMN "slug" text;
--> statement-breakpoint
UPDATE "cards" SET "slug" = lower("name");
--> statement-breakpoint
ALTER TABLE "cards" ALTER COLUMN "slug" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_slug_unique" UNIQUE("slug");
--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "rarity" text;
--> statement-breakpoint
UPDATE "cards" SET "rarity" = COALESCE("type", 'common');
--> statement-breakpoint
ALTER TABLE "cards" ALTER COLUMN "rarity" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_pack_cards" ADD COLUMN "rarity" text;
--> statement-breakpoint
UPDATE "user_pack_cards"
SET "rarity" = COALESCE("cards"."type", 'common')
FROM "cards"
WHERE "user_pack_cards"."card_id" = "cards"."id";
--> statement-breakpoint
ALTER TABLE "user_pack_cards" ALTER COLUMN "rarity" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_collection" ADD COLUMN "rarity" text;
--> statement-breakpoint
UPDATE "user_collection"
SET "rarity" = COALESCE("cards"."type", 'common')
FROM "cards"
WHERE "user_collection"."card_id" = "cards"."id";
--> statement-breakpoint
ALTER TABLE "user_collection" ALTER COLUMN "rarity" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "cards" DROP COLUMN "type";
