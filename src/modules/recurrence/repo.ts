import { db } from '@app/db/client.js'
import { taskRecurrences, reminders, tasks, users, memberships } from '@app/db/schema.js'
import { eq, and, lte, sql } from 'drizzle-orm'
import { errors } from '@app/platform/errors.js'
import type { RecurrenceCreate, RecurrenceUpdate, ReminderQuery } from '@app/contracts/recurrence.js'
import { computeNextRun, defaultIntervalFor } from './service.js'

export interface DueReminder {
  id: string
  taskId: string
  title: string
  description: string | null
  nextRunAt: Date
}

export async function createRecurrence(workspaceId: string, data: RecurrenceCreate) {
  const intervalDays = data.intervalDays || defaultIntervalFor(data.frequency)
  const [row] = await db
    .insert(taskRecurrences)
    .values({
      taskId: data.taskId,
      workspaceId,
      frequency: data.frequency,
      intervalDays,
      reminderLeadHours: data.reminderLeadHours,
      timezone: data.timezone,
      nextRunAt: computeNextRun(new Date(), data.frequency, intervalDays),
    })
    .returning()
  if (!row) throw errors.badRequest('Failed to create recurrence')
  return row
}

export async function getRecurrence(id: string, _workspaceId: string) {
  const rows = await db.select().from(taskRecurrences).where(eq(taskRecurrences.id, id))
  return rows[0]!
}

export async function updateRecurrence(id: string, data: RecurrenceUpdate) {
  const rows = await db
    .update(taskRecurrences)
    .set(data as any)
    .where(eq(taskRecurrences.id, id))
    .returning()
  if (rows.length === 0) throw errors.notFound('Recurrence')
  return rows[0]!
}

export async function deleteRecurrence(id: string) {
  await db.delete(taskRecurrences).where(eq(taskRecurrences.id, id))
}

export async function listRecurrences(workspaceId: string) {
  return db.select().from(taskRecurrences).where(eq(taskRecurrences.workspaceId, workspaceId))
}

export async function listDueReminders(query: ReminderQuery) {
  const rows = await db.execute(
    sql.raw(`
      select r.id, r.task_id, r.next_run_at, t.title, t.description
      from reminders r
      join tasks t on t.id = r.task_id
      where r.workspace_id = '${query.workspaceId}'
        and r.sent = false
      order by ${query.sortBy} desc
      limit ${query.limit}
    `),
  )
  return rows as unknown as DueReminder[]
}

export async function listPendingReminders(workspaceId: string, now: Date): Promise<DueReminder[]> {
  const rows = await db
    .select({
      id: reminders.id,
      taskId: reminders.taskId,
      title: tasks.title,
      description: tasks.description,
      nextRunAt: reminders.nextRunAt,
    })
    .from(reminders)
    .innerJoin(tasks, eq(tasks.id, reminders.taskId))
    .where(and(eq(reminders.workspaceId, workspaceId), lte(reminders.nextRunAt, now)))
  return rows
}

export async function markSent(id: string) {
  await db.update(reminders).set({ sent: true }).where(eq(reminders.id, id))
}

export async function listAllDueRecurrences() {
  const now = new Date()
  return db.select().from(taskRecurrences).where(lte(taskRecurrences.nextRunAt, now))
}

export async function taskFor(taskId: string) {
  const rows = await db.select().from(tasks).where(eq(tasks.id, taskId))
  return rows[0]!
}

export async function tasksDueSoon(workspaceId: string, before: Date) {
  const all = await db.select().from(tasks).where(eq(tasks.workspaceId, workspaceId))
  return all.filter((t) => t.dueDate !== null && t.dueDate <= before)
}

export async function listWorkspaceMembers(workspaceId: string) {
  return db
    .select({ userId: users.id, email: users.email, name: users.name })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.workspaceId, workspaceId))
}

export async function scheduleReminder(
  recurrenceId: string,
  workspaceId: string,
  taskId: string,
  nextRunAt: Date,
) {
  const existing = await db
    .select()
    .from(reminders)
    .where(and(eq(reminders.recurrenceId, recurrenceId), eq(reminders.sent, false)))
  if (existing.length > 0) return existing[0]!
  const [row] = await db
    .insert(reminders)
    .values({ recurrenceId, workspaceId, taskId, nextRunAt })
    .returning()
  return row!
}

export async function bumpNextRun(id: string, nextRunAt: Date) {
  await db.update(taskRecurrences).set({ nextRunAt }).where(eq(taskRecurrences.id, id))
}
