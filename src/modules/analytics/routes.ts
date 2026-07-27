import type { FastifyPluginAsync } from 'fastify'
import { getAnalytics } from './service.js'

export const analyticsRoutes: FastifyPluginAsync = async (fastify) => {
  // D4-6: no pagination — returns all projects in one response
  fastify.get('/workspaces/:workspaceId/analytics', async (req, reply) => {
    const { workspaceId } = req.params as { workspaceId: string }
    const { workspaceId: userWsId } = req.user as { workspaceId: string }
    if (workspaceId !== userWsId) return reply.status(403).send({ error: 'Forbidden' })
    const data = await getAnalytics(workspaceId)
    reply.send(data)
  })
}
