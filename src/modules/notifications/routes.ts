import type { FastifyPluginAsync } from 'fastify'
import * as service from './service.js'

export const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/workspaces/:workspaceId/notifications', async (req, reply) => {
    const { workspaceId } = req.params as { workspaceId: string }
    const { workspaceId: userWsId, userId } = req.user as { workspaceId: string; userId: string }
    if (workspaceId !== userWsId) return reply.status(403).send({ error: 'Forbidden' })
    const items = await service.getNotifications(userId, workspaceId)
    reply.send({ items, total: items.length })
  })

  fastify.post('/workspaces/:workspaceId/notifications/mark-read', async (req, reply) => {
    const { workspaceId } = req.params as { workspaceId: string }
    const { workspaceId: userWsId } = req.user as { workspaceId: string }
    if (workspaceId !== userWsId) return reply.status(403).send({ error: 'Forbidden' })
    // stub — no persistent notification store in baseline
    reply.send({ updated: 0 })
  })
}
