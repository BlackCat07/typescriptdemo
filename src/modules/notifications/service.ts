import * as repo from './repo.js'
import { mailer } from '@app/adapters/mailer.js'

export async function getNotifications(userId: string, workspaceId: string) {
  return repo.getNotifications(userId, workspaceId)
}

export async function sendDigest(userId: string) {
  const notifications = await repo.getNotifications(userId, '')
  if (notifications.length === 0) return
  await mailer.send(userId, 'Your task digest', notifications.map((n) => n.message).join('\n'))
}
