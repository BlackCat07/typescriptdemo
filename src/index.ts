import Fastify from 'fastify'
import fjwt from '@fastify/jwt'
import { healthRoutes } from '@app/modules/health/routes.js'
import { authRoutes } from '@app/modules/auth/routes.js'
import { workspaceRoutes } from '@app/modules/workspaces/routes.js'
import { projectRoutes } from '@app/modules/projects/routes.js'
import { taskRoutes } from '@app/modules/tasks/routes.js'
import { commentRoutes } from '@app/modules/comments/routes.js'
import { notificationRoutes } from '@app/modules/notifications/routes.js'
import { activityRoutes } from '@app/modules/activity/routes.js'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; workspaceId: string }
    user: { userId: string; workspaceId: string }
  }
}

export async function buildApp() {
  const app = Fastify({ logger: false })

  const jwtSecret = process.env['JWT_SECRET']
  if (!jwtSecret) throw new Error('JWT_SECRET environment variable is required')

  await app.register(fjwt, { secret: jwtSecret })

  app.addHook('preHandler', async (req, reply) => {
    const routeConfig = req.routeOptions.config as { skipAuth?: boolean } | undefined
    if (routeConfig?.skipAuth) return
    try {
      await req.jwtVerify()
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
  })

  app.setErrorHandler((err: Error & { statusCode?: number }, _req, reply) => {
    const status = err.statusCode ?? 500
    reply.status(status).send({ error: err.message })
  })

  await app.register(healthRoutes)
  await app.register(authRoutes)
  await app.register(workspaceRoutes)
  await app.register(projectRoutes)
  await app.register(taskRoutes)
  await app.register(commentRoutes)
  await app.register(notificationRoutes)
  await app.register(activityRoutes)

  return app
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const port = Number(process.env['PORT'] ?? 3000)
  const app = await buildApp()
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`Listening on port ${port}`)
}
