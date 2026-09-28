ALTER TABLE "videos" ADD COLUMN "category" text DEFAULT 'tutorial' NOT NULL;--> statement-breakpoint
CREATE INDEX "videos_category_idx" ON "videos" USING btree ("category");