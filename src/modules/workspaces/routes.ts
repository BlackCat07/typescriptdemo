import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import * as service from './service.js'

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
}
