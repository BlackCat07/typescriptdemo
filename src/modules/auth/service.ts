import bcrypt from 'bcryptjs'
import { db } from '@app/db/client.js'
import { users, workspaces, memberships } from '@app/db/schema.js'
import { eq, and } from 'drizzle-orm'
import { errors } from '@app/platform/errors.js'

export async function registerUser(params: {
  email: string
  password: string
  name: string
  workspaceSlug: string
}) {
  const existing = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.slug, params.workspaceSlug))

  if (existing.length > 0) throw errors.conflict('Workspace slug already taken')

  const [workspace] = await db
    .insert(workspaces)
    .values({ name: params.workspaceSlug, slug: params.workspaceSlug })
    .returning()

  if (!workspace) throw errors.badRequest('Failed to create workspace')

  const passwordHash = await bcrypt.hash(params.password, 10)
  const [user] = await db
    .insert(users)
    .values({ email: params.email, passwordHash, name: params.name, workspaceId: workspace.id })
    .returning()

  if (!user) throw errors.badRequest('Failed to create user')

  await db.insert(memberships).values({ workspaceId: workspace.id, userId: user.id, role: 'owner' })

  return { userId: user.id, workspaceId: workspace.id }
}

export async function loginUser(params: { email: string; password: string }) {
  const rows = await db.select().from(users).where(eq(users.email, params.email))
  if (rows.length === 0) throw errors.unauthorized()

  const user = rows[0]!
  const valid = await bcrypt.compare(params.password, user.passwordHash)
  if (!valid) throw errors.unauthorized()

  return { userId: user.id, workspaceId: user.workspaceId }
}

export async function requireMembership(userId: string, workspaceId: string) {
  const rows = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.workspaceId, workspaceId)))

  if (rows.length === 0) throw errors.forbidden()
  return rows[0]!
}
