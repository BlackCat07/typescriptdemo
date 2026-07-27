import { db } from '@app/db/client.js'
import { tasks, auditLog } from '@app/db/schema.js'
import { eq, and } from 'drizzle-orm'
import { errors } from '@app/platform/errors.js'
import type { TaskCreate, TaskUpdate, TaskListQuery, BulkImportBody } from '@app/contracts/tasks.js'

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

export async function bulkInsert(
  items: BulkImportBody['items'],
  ctx: { projectId: string; workspaceId: string; actorId: string },
) {
  await db.transaction(async (tx) => {
    // D3-3: sequential per-row inserts instead of a single batch insert
    for (const item of items) {
      await tx.insert(tasks).values({
        ...item,
        projectId: ctx.projectId,
        workspaceId: ctx.workspaceId,
        dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
      })
    }
    // D3-2: missing await — audit write may be skipped before transaction commits
    tx.insert(auditLog).values({
      workspaceId: ctx.workspaceId,
      action: 'bulk_import',
      actorId: ctx.actorId,
    })
  })
}
