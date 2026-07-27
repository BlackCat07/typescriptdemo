import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import * as service from './service.js'

const CommentCreateSchema = z.object({ body: z.string().min(1) })

export const commentRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/tasks/:taskId/comments', async (req, reply) => {
    const { taskId } = req.params as { taskId: string }
    const { workspaceId, userId } = req.user as { workspaceId: string; userId: string }
    const { body } = CommentCreateSchema.parse(req.body)
    const comment = await service.createComment(taskId, workspaceId, userId, body)
    reply.status(201).send(comment)
  })

  fastify.get('/tasks/:taskId/comments', async (req, reply) => {
    const { taskId } = req.params as { taskId: string }
    const { workspaceId } = req.user as { workspaceId: string }
    const list = await service.listComments(taskId, workspaceId)
    reply.send(list)
  })
}
