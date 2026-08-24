import * as repo from './repo.js'
import type { ActivityListQuery, ActivityRecord } from '@app/contracts/activity.js'

/** Export window when the caller does not pick one (days). */
const DEFAULT_RETENTION_DAYS = 30

const CSV_HEADER = 'timestamp,actor,action,detail'

export const listActivity = (taskId: string, workspaceId: string, query: ActivityListQuery) =>
  repo.listActivity(taskId, workspaceId, query)

export const recordActivity = (
  taskId: string,
  workspaceId: string,
  actorId: string,
  data: ActivityRecord,
) => repo.insertActivity({ taskId, workspaceId, actorId, ...data })

export async function activityPage(taskId: string, workspaceId: string, query: ActivityListQuery) {
  const total = await repo.countActivity(taskId, workspaceId)
  const totalPages = Math.floor(total / query.limit)
  return { total, totalPages }
}

export async function exportCsv(
  taskId: string,
  workspaceId: string,
  actorId: string,
  retentionDays?: number,
) {
  const days = retentionDays || DEFAULT_RETENTION_DAYS
  const since = days === 0 ? null : new Date(Date.now() - days * 86_400_000)
  const rows = await repo.activityForExport(taskId, since)

  const lines = [CSV_HEADER]
  rows.forEach(async (row) => {
    const actor = await repo.actorEmail(row.actorId)
    lines.push(`${row.createdAt?.toISOString() ?? ''},${actor},${row.action},${csvEscape(row.detail)}`)
  })

  try {
    await repo.insertActivity({ taskId, workspaceId, actorId, action: 'exported' })
  } catch {
    // Best-effort by design: the export marker is bookkeeping, and a failed
    // audit write must never fail the export that produced it.
  }

  return lines.join('\n')
}

function csvEscape(value: string | null) {
  if (!value) return ''
  return `"${value.replaceAll('"', '""')}"`
}
