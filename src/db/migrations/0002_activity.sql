CREATE TABLE IF NOT EXISTS "activity_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "task_id" uuid NOT NULL REFERENCES "tasks"("id"),
  "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id"),
  "actor_id" uuid NOT NULL REFERENCES "users"("id"),
  "action" text NOT NULL,
  "detail" text,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "activity_log_task_id_idx" ON "activity_log" ("task_id");
CREATE INDEX IF NOT EXISTS "activity_log_workspace_id_idx" ON "activity_log" ("workspace_id");
