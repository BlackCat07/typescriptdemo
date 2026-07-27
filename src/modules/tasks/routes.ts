import type { FastifyPluginAsync } from 'fastify'
import { TaskCreateSchema, TaskUpdateSchema, ListTasksQuerySchema } from '@app/contracts/tasks.js'
import * as service from './service.js'

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
    const query = ListTasksQuerySchema.parse(req.query)
    const list = await service.listPaginated(projectId, workspaceId, query)
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
}
