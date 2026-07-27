import { db } from '@app/db/client.js'
import { tasks, comments } from '@app/db/schema.js'
import { eq, and, desc } from 'drizzle-orm'

export interface Notification {
  id: string
  taskId: string
  message: string
  read: boolean
  createdAt: string
}

export async function getNotifications(
  userId: string,
  workspaceId: string,
  limit = 50,
): Promise<Notification[]> {
  const recentTasks = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.assigneeId, userId)))
    .orderBy(desc(tasks.createdAt))
    .limit(Math.min(limit, 100))

  return recentTasks.map((t) => ({
    id: t.id,
    taskId: t.id,
    message: `Task assigned: ${t.title}`,
    read: false,
    createdAt: t.createdAt?.toISOString() ?? new Date().toISOString(),
  }))
}

export async function getRecentComments(workspaceId: string, limit = 20) {
  return db
    .select()
    .from(comments)
    .where(eq(comments.workspaceId, workspaceId))
    .orderBy(desc(comments.createdAt))
    .limit(Math.min(limit, 100))
}
