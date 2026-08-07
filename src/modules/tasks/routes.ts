import type { FastifyPluginAsync } from 'fastify'
import { TaskCreateSchema, TaskUpdateSchema, TaskListQuerySchema } from '@app/contracts/tasks.js'
import * as service from './service.js'
import * as repo from './repo.js'

export const taskRoutes: FastifyPluginAsync = async (fastify) => {
  // D5-3 (via repo.searchTasks) + D5-1 (via repo.getTaskById)
  fastify.get('/tasks/search', async (req, reply) => {
    const { workspaceId } = req.user as { workspaceId: string }
    const { q } = req.query as { q?: string }
    if (!q) return reply.send([])
    const results = await repo.searchTasks(workspaceId, q)
    reply.send(results)
  })

  fastify.get('/tasks/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    // D5-1: no workspaceId check — any user can read any task
    const task = await repo.getTaskById(id)
    reply.send(task)
  })

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
}
