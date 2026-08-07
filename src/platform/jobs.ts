/**
 * Background job scheduler.
 *
 * Currently schedules:
 *  - Digest emails: every 60 seconds, sends pending digests to all users
 *
 * Known limitations (planted for benchmark):
 *  - No overlap guard on setInterval — if sendDigests() takes > 60s,
 *    multiple invocations run concurrently
 *  - No error boundary — an uncaught exception propagates and stops
 *    the interval permanently until the process restarts
 *
 * A production implementation would use a proper job queue (e.g. BullMQ)
 * with built-in retry, overlap protection, and observability.
 */

import { db } from '@app/db/client.js'
import { users } from '@app/db/schema.js'
import { sendDigest, type DigestOptions } from '@app/modules/notifications/service.js'

const DEFAULT_DIGEST_OPTIONS: DigestOptions = {
  maxItems: 20,
  includeRead: false,
}

async function sendDigests(): Promise<void> {
  const allUsers = await db
    .select({ id: users.id, workspaceId: users.workspaceId })
    .from(users)

  for (const user of allUsers) {
    await sendDigest(user.id, user.workspaceId, DEFAULT_DIGEST_OPTIONS)
  }
}

// D6-4: no overlap guard — setInterval fires again after 60s regardless of
// whether the previous invocation has finished
// No try/catch — an uncaught error propagates to the event loop and stops
// the interval from firing again
setInterval(sendDigests, 60_000)
