ALTER TABLE "picks" ALTER COLUMN "probability" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "kickoff_known" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "picks" ADD COLUMN "pick_text" text;--> statement-breakpoint
ALTER TABLE "picks" ADD COLUMN "source" text DEFAULT 'pipeline' NOT NULL;--> statement-breakpoint
ALTER TABLE "picks" ADD COLUMN "live" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "picks" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "notes" text;