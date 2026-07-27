import { db } from '@app/db/client.js'
import { workspaces } from '@app/db/schema.js'
import { eq } from 'drizzle-orm'
import { errors } from '@app/platform/errors.js'

export async function getWorkspaceById(id: string, workspaceId: string) {
  if (id !== workspaceId) throw errors.forbidden()
  const rows = await db.select().from(workspaces).where(eq(workspaces.id, id))
  if (rows.length === 0) throw errors.notFound('Workspace')
  return rows[0]!
}

export async function updateWorkspace(id: string, workspaceId: string, data: { name?: string }) {
  if (id !== workspaceId) throw errors.forbidden()
  const rows = await db
    .update(workspaces)
    .set({ name: data.name })
    .where(eq(workspaces.id, id))
    .returning()
  if (rows.length === 0) throw errors.notFound('Workspace')
  return rows[0]!
}
