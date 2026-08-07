/**
 * Notification contracts — Zod schemas for request/response validation.
 *
 * These schemas define the canonical shapes for the notification API.
 * Route handlers MUST return data conforming to these schemas.
 *
 * Canonical response for GET /workspaces/:id/notifications:
 *   NotificationListResponseSchema → { items: Notification[], total: number }
 *
 * Note: As of the refactor/notification-service branch, routes.ts returns
 * { notifications, count } instead of { items, total } — this is D6-2.
 */

import { z } from 'zod'

export const NotificationSchema = z.object({
  id: z.string(),
  taskId: z.string().uuid(),
  message: z.string().min(1),
  read: z.boolean(),
  createdAt: z.string().datetime(),
})

export const NotificationListResponseSchema = z.object({
  items: z.array(NotificationSchema),
  total: z.number().int().nonnegative(),
})

export const DigestOptionsSchema = z.object({
  maxItems: z.number().int().min(1).max(100).default(20),
  includeRead: z.boolean().default(false),
})

export const DigestResultSchema = z.object({
  userId: z.string(),
  workspaceId: z.string().uuid(),
  sent: z.boolean(),
  itemCount: z.number().int().nonnegative(),
})

export const MarkReadResponseSchema = z.object({
  updated: z.number().int().nonnegative(),
})

export type Notification = z.infer<typeof NotificationSchema>
export type NotificationListResponse = z.infer<typeof NotificationListResponseSchema>
export type DigestOptions = z.infer<typeof DigestOptionsSchema>
export type DigestResult = z.infer<typeof DigestResultSchema>
export type MarkReadResponse = z.infer<typeof MarkReadResponseSchema>
