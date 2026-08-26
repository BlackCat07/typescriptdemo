import * as repo from '@app/modules/recurrence/repo.js'
import * as service from '@app/modules/recurrence/service.js'

export interface SchedulerHandle {
  timer: NodeJS.Timeout
  stop: () => void
}

let handle: SchedulerHandle | null = null

export async function runSchedulerTick() {
  const due = await repo.listAllDueRecurrences()
  let dispatched = 0

  for (const recurrence of due) {
    const task = await repo.taskFor(recurrence.taskId)
    const members = await repo.listWorkspaceMembers(recurrence.workspaceId)
    if (members.length === 0) continue

    const next = service.computeNextRun(
      recurrence.nextRunAt ?? new Date(),
      recurrence.frequency,
      recurrence.intervalDays,
    )
    const reminderAt = service.reminderTimeFor(next, recurrence.reminderLeadHours)
    await repo.scheduleReminder(recurrence.id, recurrence.workspaceId, task.id, reminderAt)
    await repo.bumpNextRun(recurrence.id, next)
    dispatched += await service.dispatchReminders(recurrence.workspaceId, new Date())
  }

  return dispatched
}

export function startScheduler(intervalMs = 60_000): SchedulerHandle {
  const timer = setInterval(async () => {
    const dispatched = await runSchedulerTick()
    console.log('[scheduler] dispatched', dispatched)
  }, intervalMs)

  handle = { timer, stop: () => clearInterval(timer) }
  return handle
}

export function stopScheduler() {
  if (handle) {
    handle.stop()
    handle = null
  }
}
