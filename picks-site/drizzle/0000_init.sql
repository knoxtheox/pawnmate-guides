CREATE TABLE "attd_players" (
	"id" serial PRIMARY KEY NOT NULL,
	"season" integer NOT NULL,
	"week" integer NOT NULL,
	"game_id" integer,
	"model_version_id" integer,
	"player" text NOT NULL,
	"team" text NOT NULL,
	"position" text,
	"o" double precision,
	"u" double precision,
	"t" double precision,
	"d" double precision,
	"m" double precision,
	"r" double precision,
	"g" double precision,
	"s" double precision,
	"rank" integer,
	"lambda" double precision,
	"p" double precision,
	"inputs" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attd_selections" (
	"id" serial PRIMARY KEY NOT NULL,
	"season" integer NOT NULL,
	"week" integer NOT NULL,
	"attd_player_id" integer,
	"player" text NOT NULL,
	"team" text,
	"position" text,
	"opponent" text,
	"s" double precision,
	"rank" integer,
	"model_p" double precision,
	"odds" integer,
	"odds_pulled_at" timestamp with time zone,
	"break_even" double precision,
	"edge" double precision,
	"ev" double precision,
	"stake" numeric(12, 2),
	"result" text DEFAULT 'open' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"sport" text NOT NULL,
	"season" integer NOT NULL,
	"week" integer NOT NULL,
	"kickoff" timestamp with time zone NOT NULL,
	"home" text NOT NULL,
	"away" text NOT NULL,
	"neutral" boolean DEFAULT false NOT NULL,
	"venue" text,
	"home_score" integer,
	"away_score" integer,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"odds_api_id" text,
	"cfbd_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "injuries" (
	"id" serial PRIMARY KEY NOT NULL,
	"sport" text NOT NULL,
	"team" text NOT NULL,
	"player" text NOT NULL,
	"position" text,
	"status" text NOT NULL,
	"is_starter" boolean DEFAULT false NOT NULL,
	"source" text,
	"pulled_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"sport" text NOT NULL,
	"version" integer NOT NULL,
	"parameters" jsonb NOT NULL,
	"parent_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	"is_active" boolean DEFAULT false NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "odds_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"pulled_at" timestamp with time zone NOT NULL,
	"book" text DEFAULT 'fanduel' NOT NULL,
	"ml_home" integer,
	"ml_away" integer,
	"spread_home" double precision,
	"spread_home_price" integer,
	"spread_away_price" integer,
	"total" double precision,
	"over_price" integer,
	"under_price" integer,
	"is_closing" boolean DEFAULT false NOT NULL,
	"raw" jsonb
);
--> statement-breakpoint
CREATE TABLE "picks" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"model_version_id" integer NOT NULL,
	"market" text NOT NULL,
	"projected_margin" double precision,
	"projected_total" double precision,
	"projected_home" double precision,
	"projected_away" double precision,
	"probability" double precision NOT NULL,
	"tier" text,
	"pick_side" text NOT NULL,
	"pick_line" double precision,
	"odds_used" integer,
	"break_even" double precision,
	"edge" double precision,
	"ev" double precision,
	"is_value" boolean DEFAULT false NOT NULL,
	"input_snapshots" jsonb,
	"is_current" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" serial PRIMARY KEY NOT NULL,
	"training_run_id" integer NOT NULL,
	"model_version_id" integer NOT NULL,
	"parameter" text NOT NULL,
	"current_value" jsonb NOT NULL,
	"proposed_value" jsonb NOT NULL,
	"games_used" integer NOT NULL,
	"before_metrics" jsonb,
	"after_metrics" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"decided_at" timestamp with time zone,
	"resulting_model_version_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "results" (
	"id" serial PRIMARY KEY NOT NULL,
	"pick_id" integer NOT NULL,
	"result" text NOT NULL,
	"margin_miss" double precision,
	"total_miss" double precision,
	"graded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "results_pick_id_unique" UNIQUE("pick_id")
);
--> statement-breakpoint
CREATE TABLE "team_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"sport" text NOT NULL,
	"season" integer NOT NULL,
	"week" integer NOT NULL,
	"team" text NOT NULL,
	"source" text NOT NULL,
	"rating" double precision,
	"extra" jsonb,
	"pulled_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"placed_at" timestamp with time zone NOT NULL,
	"description" text NOT NULL,
	"legs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"odds" integer,
	"stake" numeric(12, 2) NOT NULL,
	"result" text DEFAULT 'open' NOT NULL,
	"return" numeric(12, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"sport" text NOT NULL,
	"run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"games_graded" integer DEFAULT 0 NOT NULL,
	"metrics" jsonb,
	"status" text NOT NULL,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "attd_players" ADD CONSTRAINT "attd_players_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attd_players" ADD CONSTRAINT "attd_players_model_version_id_model_versions_id_fk" FOREIGN KEY ("model_version_id") REFERENCES "public"."model_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attd_selections" ADD CONSTRAINT "attd_selections_attd_player_id_attd_players_id_fk" FOREIGN KEY ("attd_player_id") REFERENCES "public"."attd_players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "odds_snapshots" ADD CONSTRAINT "odds_snapshots_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "picks" ADD CONSTRAINT "picks_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "picks" ADD CONSTRAINT "picks_model_version_id_model_versions_id_fk" FOREIGN KEY ("model_version_id") REFERENCES "public"."model_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_training_run_id_training_runs_id_fk" FOREIGN KEY ("training_run_id") REFERENCES "public"."training_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_model_version_id_model_versions_id_fk" FOREIGN KEY ("model_version_id") REFERENCES "public"."model_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_resulting_model_version_id_model_versions_id_fk" FOREIGN KEY ("resulting_model_version_id") REFERENCES "public"."model_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_pick_id_picks_id_fk" FOREIGN KEY ("pick_id") REFERENCES "public"."picks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attd_players_week_idx" ON "attd_players" USING btree ("season","week");--> statement-breakpoint
CREATE UNIQUE INDEX "games_matchup_uq" ON "games" USING btree ("sport","season","week","home","away");--> statement-breakpoint
CREATE UNIQUE INDEX "games_odds_api_uq" ON "games" USING btree ("odds_api_id");--> statement-breakpoint
CREATE INDEX "games_week_idx" ON "games" USING btree ("sport","season","week");--> statement-breakpoint
CREATE INDEX "injuries_team_idx" ON "injuries" USING btree ("sport","team","pulled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "model_versions_sport_version_uq" ON "model_versions" USING btree ("sport","version");--> statement-breakpoint
CREATE UNIQUE INDEX "model_versions_one_active_uq" ON "model_versions" USING btree ("sport") WHERE "model_versions"."is_active";--> statement-breakpoint
CREATE INDEX "odds_game_idx" ON "odds_snapshots" USING btree ("game_id","pulled_at");--> statement-breakpoint
CREATE INDEX "picks_game_idx" ON "picks" USING btree ("game_id","market");--> statement-breakpoint
CREATE INDEX "ratings_lookup_idx" ON "team_ratings" USING btree ("sport","season","week","source","team");