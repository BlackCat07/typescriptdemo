import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { registerUser, loginUser } from './service.js'

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  workspaceSlug: z.string().min(1).regex(/^[a-z0-9-]+$/),
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/auth/register', { config: { skipAuth: true } }, async (req, reply) => {
    const body = RegisterSchema.parse(req.body)
    const payload = await registerUser(body)
    const token = fastify.jwt.sign(payload)
    reply.status(201).send({ token })
  })

  fastify.post('/auth/login', { config: { skipAuth: true } }, async (req, reply) => {
    const body = LoginSchema.parse(req.body)
    const payload = await loginUser(body)
    const token = fastify.jwt.sign(payload)
    reply.send({ token })
  })
}
