import { db } from '@app/db/client.js'
import { comments } from '@app/db/schema.js'
import { eq, and } from 'drizzle-orm'
import { errors } from '@app/platform/errors.js'

export async function listComments(taskId: string, workspaceId: string) {
  return db
    .select()
    .from(comments)
    .where(and(eq(comments.taskId, taskId), eq(comments.workspaceId, workspaceId)))
}

export async function createComment(
  taskId: string,
  workspaceId: string,
  authorId: string,
  body: string,
) {
  const [row] = await db
    .insert(comments)
    .values({ taskId, workspaceId, authorId, body })
    .returning()
  if (!row) throw errors.badRequest('Failed to create comment')
  return row
}
