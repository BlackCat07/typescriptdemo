import { pgTable, uuid, text, timestamp, integer, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core'

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  slugIdx: uniqueIndex('workspaces_slug_idx').on(t.slug),
}))

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  emailIdx: uniqueIndex('users_email_idx').on(t.email),
  workspaceIdIdx: index('users_workspace_id_idx').on(t.workspaceId),
}))

export const memberships = pgTable('memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  role: text('role').notNull().default('member'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  workspaceUserIdx: uniqueIndex('memberships_workspace_user_idx').on(t.workspaceId, t.userId),
}))

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  workspaceIdIdx: index('projects_workspace_id_idx').on(t.workspaceId),
}))

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('todo'),
  assigneeId: uuid('assignee_id').references(() => users.id),
  dueDate: timestamp('due_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  projectIdIdx: index('tasks_project_id_idx').on(t.projectId),
  workspaceIdIdx: index('tasks_workspace_id_idx').on(t.workspaceId),
  projectStatusIdx: index('tasks_project_status_idx').on(t.projectId, t.status),
  dueDateIdx: index('tasks_due_date_idx').on(t.dueDate),
}))

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => tasks.id),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  authorId: uuid('author_id').notNull().references(() => users.id),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  taskIdIdx: index('comments_task_id_idx').on(t.taskId),
  workspaceIdIdx: index('comments_workspace_id_idx').on(t.workspaceId),
}))

export const taskRecurrences = pgTable('task_recurrences', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => tasks.id),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  frequency: text('frequency').notNull().default('weekly'),
  intervalDays: integer('interval_days').notNull().default(7),
  reminderLeadHours: integer('reminder_lead_hours').notNull().default(24),
  timezone: text('timezone').notNull().default('UTC'),
  nextRunAt: timestamp('next_run_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  taskIdIdx: index('task_recurrences_task_id_idx').on(t.taskId),
}))

export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  recurrenceId: uuid('recurrence_id').notNull().references(() => taskRecurrences.id),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  taskId: uuid('task_id').notNull().references(() => tasks.id),
  nextRunAt: timestamp('next_run_at', { withTimezone: true }).notNull(),
  sent: boolean('sent').notNull().default(false),
  attempts: integer('attempts').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  recurrenceIdIdx: index('reminders_recurrence_id_idx').on(t.recurrenceId),
}))
