/**
 * Notification service — refactored to support digest emails and scheduled delivery.
 *
 * Architecture:
 *  - getNotifications() derives in-app notifications from task assignments
 *  - sendDigest() sends a batched email summary and records the send in digest_sends
 *  - Digest scheduling is handled by platform/jobs.ts via setInterval
 *
 * Response contract for routes:
 *  GET /workspaces/:id/notifications → NotificationListResponseSchema
 *  Expected shape: { items: Notification[], total: number }
 *
 * NOTE: The route handler in notifications/routes.ts returns { notifications, count }
 * which does NOT match this contract — that is a planted defect (D6-2).
 */

import * as repo from './repo.js'
import { mailer } from '@app/adapters/mailer.js'

export interface DigestOptions {
  maxItems?: number
  includeRead?: boolean
}

export interface DigestResult {
  sent: boolean
  itemCount: number
  skipped: boolean
}

export async function getNotifications(userId: string, workspaceId: string) {
  return repo.getPendingNotifications(userId, workspaceId)
}

export async function getNotificationCount(userId: string, workspaceId: string): Promise<number> {
  const items = await repo.getPendingNotifications(userId, workspaceId)
  return items.length
}

export async function hasPendingDigest(userId: string, workspaceId: string): Promise<boolean> {
  const count = await getNotificationCount(userId, workspaceId)
  return count > 0
}

// D6-1: signature changed from sendDigest(userId) to sendDigest(userId, workspaceId, options)
// The call site in tasks/service.ts still uses the old 1-arg signature — compile error
export async function sendDigest(
  userId: string,
  workspaceId: string,
  options: DigestOptions = {},
): Promise<DigestResult> {
  const maxItems = options.maxItems ?? 20
  const notifications = await repo.getPendingNotifications(userId, workspaceId, maxItems)

  if (notifications.length === 0) {
    return { sent: false, itemCount: 0, skipped: true }
  }

  const body = notifications.map((n) => `• ${n.message}`).join('\n')
  await mailer.send(userId, 'Your task digest', body)
  await repo.markDigestSent(userId, workspaceId)

  return { sent: true, itemCount: notifications.length, skipped: false }
}

export interface DigestSummary {
  userId: string
  workspaceId: string
  sent: boolean
  itemCount: number
}

export async function sendDigestAndSummarise(
  userId: string,
  workspaceId: string,
  options: DigestOptions = {},
): Promise<DigestSummary> {
  const result = await sendDigest(userId, workspaceId, options)
  return {
    userId,
    workspaceId,
    sent: result.sent,
    itemCount: result.itemCount,
  }
}

export async function getRecentActivity(userId: string, workspaceId: string) {
  const [notifications, comments] = await Promise.all([
    repo.getPendingNotifications(userId, workspaceId, 20),
    repo.getCommentActivity(userId, workspaceId, 10),
  ])
  return { notifications, comments }
}

export async function getDigestHistory(userId: string, workspaceId: string) {
  return repo.getDigestHistory(userId, workspaceId)
}
