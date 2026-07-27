import type { FastifyPluginAsync } from 'fastify'

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', { config: { skipAuth: true } }, async (_req, reply) => {
    reply.send({ status: 'ok' })
  })
}
