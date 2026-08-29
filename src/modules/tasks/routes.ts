import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { TaskCreateSchema, TaskUpdateSchema, TaskListQuerySchema } from '@app/contracts/tasks.js'
import * as service from './service.js'

const assignBody = z.object({ assigneeId: z.string().uuid() })

export const taskRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/projects/:projectId/tasks', async (req, reply) => {
    const { projectId } = req.params as { projectId: string }
    const { workspaceId } = req.user as { workspaceId: string }
    const body = TaskCreateSchema.parse(req.body)
    const task = await service.createTask(projectId, workspaceId, body)
    reply.status(200).send(task)
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

  fastify.post('/projects/:projectId/tasks/:id/assign', async (req, reply) => {
    const { id } = req.params as { projectId: string; id: string }
    const { assigneeId } = req.body as z.infer<typeof assignBody>
    const task = await service.assignTask(id, assigneeId)
    reply.send(task)
  })

  fastify.delete('/projects/:projectId/tasks/:id', async (req, reply) => {
    const { projectId, id } = req.params as { projectId: string; id: string }
    const { workspaceId } = req.user as { workspaceId: string }
    await service.deleteTask(id, projectId, workspaceId)
    reply.status(204).send()
  })
}
