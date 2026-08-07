/**
 * Notification routes.
 *
 * GET /workspaces/:workspaceId/notifications
 *   Returns derived notifications for the authenticated user.
 *   Contract (NotificationListResponseSchema): { items: Notification[], total: number }
 *
 * POST /workspaces/:workspaceId/notifications/mark-read
 *   Marks all notifications as read (stub in baseline; now triggers digest send).
 *
 * POST /workspaces/:workspaceId/notifications/digest
 *   Manually trigger a digest email for the authenticated user.
 */

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import * as service from './service.js'

const DigestOptionsSchema = z.object({
  maxItems: z.number().int().min(1).max(100).optional(),
  includeRead: z.boolean().optional(),
})

export const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/workspaces/:workspaceId/notifications', async (req, reply) => {
    const { workspaceId } = req.params as { workspaceId: string }
    const { workspaceId: userWsId, userId } = req.user as { workspaceId: string; userId: string }
    if (workspaceId !== userWsId) return reply.status(403).send({ error: 'Forbidden' })

    const rows = await service.getNotifications(userId, workspaceId)

    // D6-2: response shape drifts from NotificationListResponseSchema contract
    // Contract expects: { items: Notification[], total: number }
    // Actual response: { notifications: ..., count: ... } — wrong keys
    reply.send({ notifications: rows, count: rows.length })
  })

  fastify.post('/workspaces/:workspaceId/notifications/mark-read', async (req, reply) => {
    const { workspaceId } = req.params as { workspaceId: string }
    const { workspaceId: userWsId, userId } = req.user as { workspaceId: string; userId: string }
    if (workspaceId !== userWsId) return reply.status(403).send({ error: 'Forbidden' })
    await service.sendDigest(userId, workspaceId, { maxItems: 10 })
    reply.send({ updated: 0 })
  })

  fastify.post('/workspaces/:workspaceId/notifications/digest', async (req, reply) => {
    const { workspaceId } = req.params as { workspaceId: string }
    const { workspaceId: userWsId, userId } = req.user as { workspaceId: string; userId: string }
    if (workspaceId !== userWsId) return reply.status(403).send({ error: 'Forbidden' })
    const options = DigestOptionsSchema.parse(req.body ?? {})
    const summary = await service.sendDigestAndSummarise(userId, workspaceId, options)
    reply.send(summary)
  })

  fastify.get('/workspaces/:workspaceId/notifications/count', async (req, reply) => {
    const { workspaceId } = req.params as { workspaceId: string }
    const { workspaceId: userWsId, userId } = req.user as { workspaceId: string; userId: string }
    if (workspaceId !== userWsId) return reply.status(403).send({ error: 'Forbidden' })
    const count = await service.getNotificationCount(userId, workspaceId)
    reply.send({ count })
  })
}
