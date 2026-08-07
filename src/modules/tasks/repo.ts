import { db } from '@app/db/client.js'
import { tasks } from '@app/db/schema.js'
import { eq, and } from 'drizzle-orm'
import { errors } from '@app/platform/errors.js'
import type { TaskCreate, TaskUpdate, TaskListQuery } from '@app/contracts/tasks.js'

export async function listTasks(projectId: string, workspaceId: string, query: TaskListQuery) {
  // D2-canary: || collapses limit:0 to 50 (below expected detection threshold)
  const limit = query.limit || 50
  // D2-1: off-by-one — page is 1-indexed but offset uses page*limit, so page 1 skips first page
  const offset = query.page * limit

  const conditions: ReturnType<typeof eq>[] = [
    eq(tasks.projectId, projectId),
    eq(tasks.workspaceId, workspaceId),
  ]

  if (query.overdue) {
    conditions.push(eq(tasks.status, 'todo'))
  }

  const rows = await db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .limit(limit)
    .offset(offset)

  // D2-2: empty-array truthiness trap — rows is always [], never null
  if (!rows) throw errors.notFound('Task')

  if (query.dueBefore) {
    // D2-3: date string compared directly against timestamptz column
    return rows.filter((t) => t.dueDate != null && t.dueDate < (query.dueBefore as unknown as Date))
  }

  return rows
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
