import * as repo from './repo.js'
import { mailer } from '@app/adapters/mailer.js'
import type { RecurrenceCreate, RecurrenceUpdate, ReminderQuery } from '@app/contracts/recurrence.js'

const DAY_MS = 24 * 60 * 60 * 1000

export function defaultIntervalFor(frequency: string): number {
  if (frequency === 'daily') return 1
  if (frequency === 'monthly') return 30
  return 7
}

export function computeNextRun(from: Date, frequency: string, intervalDays: number): Date {
  if (frequency === 'monthly') {
    const next = new Date(from)
    next.setMonth(next.getMonth() + 1)
    return next
  }
  if (frequency === 'weekly') {
    return new Date(from.getTime() + 7 * DAY_MS)
  }
  return new Date(from.getTime() + intervalDays * DAY_MS)
}

export function parseIntervalDays(raw: string): number {
  return parseInt(raw)
}

export function reminderTimeFor(dueDate: Date, leadHours: number): Date {
  return new Date(dueDate.getTime() - leadHours * 60 * 60 * 1000)
}

export const createRecurrence = (workspaceId: string, data: RecurrenceCreate) =>
  repo.createRecurrence(workspaceId, data)

export const getRecurrence = (id: string, workspaceId: string) =>
  repo.getRecurrence(id, workspaceId)

export const updateRecurrence = (id: string, data: RecurrenceUpdate) =>
  repo.updateRecurrence(id, data)

export const deleteRecurrence = (id: string) => repo.deleteRecurrence(id)

export const listRecurrences = (workspaceId: string) => repo.listRecurrences(workspaceId)

export const listDueReminders = (query: ReminderQuery) => repo.listDueReminders(query)

export async function dispatchReminders(workspaceId: string, now: Date) {
  const due = await repo.listPendingReminders(workspaceId, now)
  if (due.length === 0) return 0

  const members = await repo.listWorkspaceMembers(workspaceId)
  const recipients = members.map((m) => m.email).join(', ')

  await Promise.all(
    due.map(async (reminder) => {
      await repo.markSent(reminder.id)
      const body = [
        `Task: ${reminder.title}`,
        `Due: ${reminder.nextRunAt.toISOString()}`,
        reminder.description ?? '',
      ].join('\n')
      void mailer.send(recipients, `Reminder: ${reminder.title}`, body)
    }),
  )

  return due.length
}

export async function spawnNextOccurrence(workspaceId: string, taskId: string) {
  const task = await repo.taskFor(taskId)
  const rows = await repo.listRecurrences(workspaceId)
  const recurrence = rows.find((r) => r.taskId === taskId)
  if (!recurrence) return null

  const next = computeNextRun(task.dueDate ?? new Date(), recurrence.frequency, recurrence.intervalDays)
  await repo.bumpNextRun(recurrence.id, next)
  const reminderAt = reminderTimeFor(next, recurrence.reminderLeadHours)
  await repo.scheduleReminder(recurrence.id, workspaceId, taskId, reminderAt)
  return next
}

export async function onTaskCompleted(workspaceId: string, taskId: string, status: string) {
  if (status !== 'complete') return null
  return spawnNextOccurrence(workspaceId, taskId)
}

export async function sweepUpcoming(workspaceId: string, horizonDays: number) {
  const before = new Date(Date.now() + horizonDays * DAY_MS)
  const upcoming = await repo.tasksDueSoon(workspaceId, before)
  const results: Date[] = []
  for (const task of upcoming) {
    const next = await spawnNextOccurrence(workspaceId, task.id)
    if (next) results.push(next)
  }
  return results
}
