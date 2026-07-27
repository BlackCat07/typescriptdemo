/**
 * Notifications repository.
 *
 * In baseline main, notifications are derived from task assignments (no separate table).
 * This refactor adds digest_sends tracking so we can avoid re-sending digests.
 *
 * Tables used:
 *  - tasks (read-only, for deriving notifications)
 *  - comments (read-only, for comment activity)
 *  - digest_sends (read/write, for idempotency tracking)
 *
 * Notification derivation:
 *  1. Tasks assigned to the user in the workspace
 *  2. Comments on tasks the user is assigned to
 *  3. Tasks with upcoming due dates (within 24 hours)
 */

import { db } from '@app/db/client.js'
import { tasks, comments, digestSends } from '@app/db/schema.js'
import { eq, and, desc, lt } from 'drizzle-orm'
import type { Notification } from '@app/contracts/notifications.js'

export async function getPendingNotifications(
  userId: string,
  workspaceId: string,
  limit = 50,
): Promise<Notification[]> {
  const assignedTasks = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.assigneeId, userId)))
    .orderBy(desc(tasks.createdAt))
    .limit(Math.min(limit, 100))

  const taskNotifications: Notification[] = assignedTasks.map((t) => ({
    id: t.id,
    taskId: t.id,
    message: `Task assigned: ${t.title}`,
    read: false,
    createdAt: t.createdAt?.toISOString() ?? new Date().toISOString(),
  }))

  const overdueThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const upcomingTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.workspaceId, workspaceId),
        eq(tasks.assigneeId, userId),
        lt(tasks.dueDate, overdueThreshold),
      ),
    )
    .orderBy(tasks.dueDate)
    .limit(10)

  const dueSoonNotifications: Notification[] = upcomingTasks
    .filter((t) => t.dueDate != null)
    .map((t) => ({
      id: `due-${t.id}`,
      taskId: t.id,
      message: `Due soon: ${t.title}`,
      read: false,
      createdAt: t.updatedAt?.toISOString() ?? new Date().toISOString(),
    }))

  return [...taskNotifications, ...dueSoonNotifications].slice(0, limit)
}

export async function getCommentActivity(
  userId: string,
  workspaceId: string,
  limit = 20,
) {
  return db
    .select()
    .from(comments)
    .where(and(eq(comments.workspaceId, workspaceId), eq(comments.authorId, userId)))
    .orderBy(desc(comments.createdAt))
    .limit(Math.min(limit, 50))
}

export async function getDigestHistory(userId: string, workspaceId: string) {
  return db
    .select()
    .from(digestSends)
    .where(and(eq(digestSends.userId, userId), eq(digestSends.workspaceId, workspaceId)))
    .orderBy(desc(digestSends.sentAt))
}

// D6-3: check-then-insert TOCTOU — no transaction, no unique constraint on (userId, workspaceId)
// Two concurrent digest triggers can both see existing.length === 0 and both insert
export async function markDigestSent(userId: string, workspaceId: string): Promise<boolean> {
  const existing = await db
    .select()
    .from(digestSends)
    .where(and(eq(digestSends.userId, userId), eq(digestSends.workspaceId, workspaceId)))

  if (existing.length > 0) return false

  await db.insert(digestSends).values({ userId, workspaceId })
  return true
}

export async function getUnreadCount(userId: string, workspaceId: string): Promise<number> {
  const rows = await getPendingNotifications(userId, workspaceId)
  return rows.length
}
