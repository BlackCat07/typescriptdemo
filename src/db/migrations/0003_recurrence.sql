CREATE TABLE IF NOT EXISTS "task_recurrences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "task_id" uuid NOT NULL,
  "workspace_id" uuid NOT NULL,
  "frequency" text DEFAULT 'weekly' NOT NULL,
  "interval_days" integer DEFAULT 7 NOT NULL,
  "reminder_lead_hours" integer DEFAULT 24 NOT NULL,
  "timezone" text DEFAULT 'UTC' NOT NULL,
  "next_run_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "reminders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "recurrence_id" uuid NOT NULL,
  "workspace_id" uuid NOT NULL,
  "task_id" uuid NOT NULL,
  "next_run_at" timestamp with time zone NOT NULL,
  "sent" boolean DEFAULT false NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE "task_recurrences" ADD CONSTRAINT "task_recurrences_task_id_tasks_id_fk"
    FOREIGN KEY ("task_id") REFERENCES "tasks"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "task_recurrences" ADD CONSTRAINT "task_recurrences_workspace_id_workspaces_id_fk"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "reminders" ADD CONSTRAINT "reminders_recurrence_id_task_recurrences_id_fk"
    FOREIGN KEY ("recurrence_id") REFERENCES "task_recurrences"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "reminders" ADD CONSTRAINT "reminders_workspace_id_workspaces_id_fk"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "reminders" ADD CONSTRAINT "reminders_task_id_tasks_id_fk"
    FOREIGN KEY ("task_id") REFERENCES "tasks"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "task_recurrences_task_id_idx" ON "task_recurrences" ("task_id");
CREATE INDEX IF NOT EXISTS "reminders_recurrence_id_idx" ON "reminders" ("recurrence_id");
