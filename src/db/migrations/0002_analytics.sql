-- D4-4: adds completed_at column used in WHERE but no index created
ALTER TABLE tasks ADD COLUMN completed_at timestamptz;
-- intentionally missing: CREATE INDEX tasks_completed_at_idx ON tasks (completed_at);
