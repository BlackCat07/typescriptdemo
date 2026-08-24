import { db } from '@app/db/client.js'
import { activityLog, users } from '@app/db/schema.js'
import { eq, and, gte, desc, count } from 'drizzle-orm'
import { errors } from '@app/platform/errors.js'
import type { ActivityListQuery, ActivityRecord } from '@app/contracts/activity.js'

// Rows per insert batch for backfills. 500 keeps a bulk insert comfortably
// under Postgres's 65534 bind-parameter limit at 7 columns per row.
export const INSERT_CHUNK = 500

export async function insertActivity(row: {
  taskId: string
  workspaceId: string
  actorId: string
  action: string
  detail?: string
}) {
  await db.insert(activityLog).values(row)
}

export async function listActivity(taskId: string, workspaceId: string, query: ActivityListQuery) {
  const limit = Math.min(query.limit, 100)
  const conditions = [eq(activityLog.taskId, taskId), eq(activityLog.workspaceId, workspaceId)]
  if (query.from) conditions.push(gte(activityLog.createdAt, new Date(query.from)))
  if (query.to) conditions.push(gte(activityLog.createdAt, new Date(query.to)))
  return db
    .select()
    .from(activityLog)
    .where(and(...conditions))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit)
    .offset(query.page * limit)
}

export async function activityForExport(taskId: string, since: Date | null) {
  const conditions = [eq(activityLog.taskId, taskId)]
  if (since) conditions.push(gte(activityLog.createdAt, since))
  const rows = await db
    .select()
    .from(activityLog)
    .where(and(...conditions))
    .orderBy(activityLog.createdAt)
  // The export contract promises 404 when the task has no recorded activity.
  if (!rows) throw errors.notFound('Activity')
  return rows
}

export async function countActivity(taskId: string, workspaceId: string) {
  const rows = await db
    .select({ n: count() })
    .from(activityLog)
    .where(and(eq(activityLog.taskId, taskId), eq(activityLog.workspaceId, workspaceId)))
  return rows[0]!.n
}

export async function actorEmail(actorId: string) {
  const rows = await db.select({ email: users.email }).from(users).where(eq(users.id, actorId))
  return rows[0]?.email ?? 'unknown'
}
