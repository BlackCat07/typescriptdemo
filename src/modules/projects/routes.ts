import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import * as service from './service.js'

const ProjectCreateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
})

const ProjectUpdateSchema = ProjectCreateSchema.partial()

export const projectRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/workspaces/:workspaceId/projects', async (req, reply) => {
    const { workspaceId } = req.params as { workspaceId: string }
    const { workspaceId: userWsId } = req.user as { workspaceId: string }
    if (workspaceId !== userWsId) return reply.status(403).send({ error: 'Forbidden' })
    const body = ProjectCreateSchema.parse(req.body)
    const project = await service.createProject(workspaceId, body)
    reply.status(201).send(project)
  })

  fastify.get('/workspaces/:workspaceId/projects', async (req, reply) => {
    const { workspaceId } = req.params as { workspaceId: string }
    const { workspaceId: userWsId } = req.user as { workspaceId: string }
    if (workspaceId !== userWsId) return reply.status(403).send({ error: 'Forbidden' })
    const list = await service.listProjects(workspaceId)
    reply.send(list)
  })

  fastify.get('/workspaces/:workspaceId/projects/:id', async (req, reply) => {
    const { workspaceId, id } = req.params as { workspaceId: string; id: string }
    const { workspaceId: userWsId } = req.user as { workspaceId: string }
    if (workspaceId !== userWsId) return reply.status(403).send({ error: 'Forbidden' })
    const project = await service.getProject(id, workspaceId)
    reply.send(project)
  })

  fastify.patch('/workspaces/:workspaceId/projects/:id', async (req, reply) => {
    const { workspaceId, id } = req.params as { workspaceId: string; id: string }
    const { workspaceId: userWsId } = req.user as { workspaceId: string }
    if (workspaceId !== userWsId) return reply.status(403).send({ error: 'Forbidden' })
    const body = ProjectUpdateSchema.parse(req.body)
    const project = await service.updateProject(id, workspaceId, body)
    reply.send(project)
  })

  fastify.delete('/workspaces/:workspaceId/projects/:id', async (req, reply) => {
    const { workspaceId, id } = req.params as { workspaceId: string; id: string }
    const { workspaceId: userWsId } = req.user as { workspaceId: string }
    if (workspaceId !== userWsId) return reply.status(403).send({ error: 'Forbidden' })
    await service.deleteProject(id, workspaceId)
    reply.status(204).send()
  })
}
