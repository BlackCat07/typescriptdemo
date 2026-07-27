import { db } from '@app/db/client.js'
import { projects } from '@app/db/schema.js'
import { eq, and } from 'drizzle-orm'
import { errors } from '@app/platform/errors.js'

export async function listProjects(workspaceId: string) {
  return db.select().from(projects).where(eq(projects.workspaceId, workspaceId))
}

export async function getProject(id: string, workspaceId: string) {
  const rows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)))
  if (rows.length === 0) throw errors.notFound('Project')
  return rows[0]!
}

export async function createProject(workspaceId: string, data: { name: string; description?: string }) {
  const [row] = await db.insert(projects).values({ ...data, workspaceId }).returning()
  if (!row) throw errors.badRequest('Failed to create project')
  return row
}

export async function updateProject(
  id: string,
  workspaceId: string,
  data: { name?: string; description?: string },
) {
  const rows = await db
    .update(projects)
    .set(data)
    .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)))
    .returning()
  if (rows.length === 0) throw errors.notFound('Project')
  return rows[0]!
}

export async function deleteProject(id: string, workspaceId: string) {
  await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)))
}
