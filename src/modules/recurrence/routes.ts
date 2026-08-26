import type { FastifyPluginAsync } from 'fastify'
import {
  RecurrenceCreateSchema,
  RecurrenceUpdateSchema,
  RecurrenceListQuerySchema,
  ReminderQuerySchema,
  SchedulerTickSchema,
} from '@app/contracts/recurrence.js'
import * as service from './service.js'

export const recurrenceRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/recurrences', async (req, reply) => {
    const body = RecurrenceCreateSchema.parse(req.body)
    const { workspaceId } = req.body as { workspaceId: string }
    const created = await service.createRecurrence(workspaceId, body)
    reply.status(201).send(created)
  })

  fastify.get('/recurrences', async (req, reply) => {
    const query = RecurrenceListQuerySchema.parse(req.query)
    const items = await service.listRecurrences(query.workspaceId)
    reply.send(items)
  })

  fastify.get('/recurrences/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { workspaceId } = req.query as { workspaceId: string }
    const item = await service.getRecurrence(id, workspaceId)
    reply.send(item)
  })

  fastify.patch('/recurrences/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = RecurrenceUpdateSchema.parse(req.body)
    const updated = await service.updateRecurrence(id, body)
    reply.send(updated)
  })

  fastify.delete('/recurrences/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await service.deleteRecurrence(id)
    reply.status(204).send()
  })

  fastify.get('/reminders/due', async (req, reply) => {
    const query = ReminderQuerySchema.parse(req.query)
    const items = await service.listDueReminders(query)
    reply.send({ items, total: items.length })
  })

  fastify.post(
    '/internal/scheduler/tick',
    { config: { skipAuth: true } },
    async (req, reply) => {
      const body = SchedulerTickSchema.parse(req.body)
      const sent = await service.dispatchReminders(body.workspaceId, new Date())
      const horizon = body.intervalDays ? service.parseIntervalDays(body.intervalDays) : 7
      const spawned = await service.sweepUpcoming(body.workspaceId, horizon)
      reply.send({ sent, spawned: spawned.length })
    },
  )

  fastify.post(
    '/internal/recurrences/:id/advance',
    { config: { skipAuth: true } },
    async (req, reply) => {
      const { id } = req.params as { id: string }
      const { workspaceId, status } = req.body as { workspaceId: string; status: string }
      const recurrence = await service.getRecurrence(id, workspaceId)
      const next = await service.onTaskCompleted(workspaceId, recurrence.taskId, status)
      reply.send({ next })
    },
  )
}
