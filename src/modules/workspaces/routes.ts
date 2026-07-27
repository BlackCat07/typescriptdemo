import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import * as service from './service.js'
import { db } from '@app/db/client.js'
import { memberships } from '@app/db/schema.js'
import { and, eq } from 'drizzle-orm'

const UpdateWorkspaceSchema = z.object({ name: z.string().min(1).optional() })

export const workspaceRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/workspaces/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { workspaceId } = req.user as { workspaceId: string }
    const ws = await service.getWorkspace(id, workspaceId)
    reply.send(ws)
  })

  fastify.patch('/workspaces/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { workspaceId } = req.user as { workspaceId: string }
    const body = UpdateWorkspaceSchema.parse(req.body)
    const ws = await service.updateWorkspace(id, workspaceId, body)
    reply.send(ws)
  })

  // D5-6: mass assignment — req.body passed directly to .set(), allowing
  // role: 'owner' privilege escalation by any workspace member
  fastify.patch('/workspaces/:id/members/:userId', async (req, reply) => {
    const { id, userId } = req.params as { id: string; userId: string }
    await db
      .update(memberships)
      .set(req.body as Record<string, unknown>)
      .where(and(eq(memberships.workspaceId, id), eq(memberships.userId, userId)))
    reply.send({ ok: true })
  })
}
