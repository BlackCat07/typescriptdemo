import type { FastifyPluginAsync } from 'fastify'
import { TaskCreateSchema, TaskUpdateSchema, TaskListQuerySchema, BulkImportBodySchema } from '@app/contracts/tasks.js'
import * as service from './service.js'
import * as repo from './repo.js'

export const taskRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/projects/:projectId/tasks', async (req, reply) => {
    const { projectId } = req.params as { projectId: string }
    const { workspaceId } = req.user as { workspaceId: string }
    const body = TaskCreateSchema.parse(req.body)
    const task = await service.createTask(projectId, workspaceId, body)
    reply.status(201).send(task)
  })

  fastify.get('/projects/:projectId/tasks', async (req, reply) => {
    const { projectId } = req.params as { projectId: string }
    const { workspaceId } = req.user as { workspaceId: string }
    const query = TaskListQuerySchema.parse(req.query)
    const list = await service.listTasks(projectId, workspaceId, query)
    reply.send(list)
  })

  fastify.get('/projects/:projectId/tasks/:id', async (req, reply) => {
    const { projectId, id } = req.params as { projectId: string; id: string }
    const { workspaceId } = req.user as { workspaceId: string }
    const task = await service.getTask(id, projectId, workspaceId)
    reply.send(task)
  })

  fastify.patch('/projects/:projectId/tasks/:id', async (req, reply) => {
    const { projectId, id } = req.params as { projectId: string; id: string }
    const { workspaceId } = req.user as { workspaceId: string }
    const body = TaskUpdateSchema.parse(req.body)
    const task = await service.updateTask(id, projectId, workspaceId, body)
    reply.send(task)
  })

  fastify.delete('/projects/:projectId/tasks/:id', async (req, reply) => {
    const { projectId, id } = req.params as { projectId: string; id: string }
    const { workspaceId } = req.user as { workspaceId: string }
    await service.deleteTask(id, projectId, workspaceId)
    reply.status(204).send()
  })

  fastify.post('/projects/:projectId/tasks/bulk', async (req, reply) => {
    const { projectId } = req.params as { projectId: string }
    const { workspaceId, userId } = req.user as { workspaceId: string; userId: string }
    const body = BulkImportBodySchema.parse(req.body)

    // D3-1: forEach with async callback — promises are fire-and-forget
    // D3-4: empty catch swallows all errors and reports false success
    try {
      body.items.forEach(async (item) => {
        await repo.bulkInsert([item], { projectId, workspaceId, actorId: userId })
      })
    } catch {
      // errors silently swallowed — response below always claims success
    }

    reply.status(201).send({ created: body.items.length })
  })
}
