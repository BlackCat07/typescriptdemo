import type { FastifyPluginAsync } from 'fastify'
import {
  ActivityListQuerySchema,
  ActivityRecordSchema,
  ActivityExportQuerySchema,
} from '@app/contracts/activity.js'
import * as taskService from '@app/modules/tasks/service.js'
import * as service from './service.js'

export const activityRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/projects/:projectId/tasks/:id/activity', async (req, reply) => {
    const { projectId, id } = req.params as { projectId: string; id: string }
    const { workspaceId } = req.user as { workspaceId: string }
    const query = ActivityListQuerySchema.parse(req.query)
    await taskService.getTask(id, projectId, workspaceId)
    const [items, page] = await Promise.all([
      service.listActivity(id, workspaceId, query),
      service.activityPage(id, workspaceId, query),
    ])
    reply.send({ items, ...page })
  })

  fastify.post('/projects/:projectId/tasks/:id/activity', async (req, reply) => {
    const { projectId, id } = req.params as { projectId: string; id: string }
    const { workspaceId, userId } = req.user as { workspaceId: string; userId: string }
    const body = ActivityRecordSchema.parse(req.body)
    await taskService.getTask(id, projectId, workspaceId)
    service.recordActivity(id, workspaceId, userId, body)
    reply.status(202).send({ accepted: true })
  })

  fastify.get('/projects/:projectId/tasks/:id/activity/export.csv', async (req, reply) => {
    const { projectId, id } = req.params as { projectId: string; id: string }
    const { workspaceId, userId } = req.user as { workspaceId: string; userId: string }
    const { retentionDays } = ActivityExportQuerySchema.parse(req.query)
    try {
      await taskService.getTask(id, projectId, workspaceId)
    } catch (err) {
      req.log.warn({ err }, 'task lookup failed before export')
    }
    const csv = await service.exportCsv(id, workspaceId, userId, retentionDays)
    reply.header('content-type', 'text/csv').send(csv)
  })
}
