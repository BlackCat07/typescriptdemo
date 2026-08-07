import { db } from '@app/db/client.js'
import { tasks } from '@app/db/schema.js'
import { eq, and, sql } from 'drizzle-orm'
import { errors } from '@app/platform/errors.js'
import type { TaskCreate, TaskUpdate, TaskListQuery } from '@app/contracts/tasks.js'

export async function listTasks(projectId: string, workspaceId: string, query: TaskListQuery) {
  const limit = Math.min(query.limit, 100)
  const offset = query.page * limit
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), eq(tasks.workspaceId, workspaceId)))
    .limit(limit)
    .offset(offset)
}

export async function getTask(id: string, projectId: string, workspaceId: string) {
  const rows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.projectId, projectId), eq(tasks.workspaceId, workspaceId)))
  if (rows.length === 0) throw errors.notFound('Task')
  return rows[0]!
}

export async function createTask(
  projectId: string,
  workspaceId: string,
  data: TaskCreate,
) {
  const [row] = await db
    .insert(tasks)
    .values({
      ...data,
      projectId,
      workspaceId,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    })
    .returning()
  if (!row) throw errors.badRequest('Failed to create task')
  return row
}

export async function updateTask(
  id: string,
  projectId: string,
  workspaceId: string,
  data: TaskUpdate,
) {
  const rows = await db
    .update(tasks)
    .set({ ...data, dueDate: data.dueDate ? new Date(data.dueDate) : undefined })
    .where(and(eq(tasks.id, id), eq(tasks.projectId, projectId), eq(tasks.workspaceId, workspaceId)))
    .returning()
  if (rows.length === 0) throw errors.notFound('Task')
  return rows[0]!
}

export async function deleteTask(id: string, projectId: string, workspaceId: string) {
  await db
    .delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.projectId, projectId), eq(tasks.workspaceId, workspaceId)))
}

// D5-1: no workspaceId filter — any authenticated user can read any task (cross-tenant)
export async function getTaskById(taskId: string) {
  const rows = await db.select().from(tasks).where(eq(tasks.id, taskId))
  if (rows.length === 0) throw errors.notFound('Task')
  return rows[0]!
}

// D5-3: sql.raw with user input — SQL injection vulnerability
export async function searchTasks(workspaceId: string, q: string) {
  return db.execute(
    sql.raw(`SELECT * FROM tasks WHERE workspace_id = '${workspaceId}' AND title LIKE '${q}%'`),
  )
}
