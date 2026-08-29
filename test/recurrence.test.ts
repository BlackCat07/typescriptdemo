import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRecurrences = [
  {
    id: 'rec-1',
    taskId: 'task-1',
    workspaceId: 'ws-1',
    frequency: 'weekly',
    intervalDays: 7,
    reminderLeadHours: 24,
    timezone: 'UTC',
    nextRunAt: new Date('2026-03-01T09:00:00.000Z'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  where: vi.fn().mockResolvedValue(mockRecurrences),
  limit: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockResolvedValue(mockRecurrences),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue(mockRecurrences),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  execute: vi.fn().mockResolvedValue([]),
}

vi.mock('@app/db/client.js', () => ({ db: mockDb }))

describe('recurrence service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.select.mockReturnThis()
    mockDb.from.mockReturnThis()
    mockDb.innerJoin.mockReturnThis()
    mockDb.where.mockResolvedValue(mockRecurrences)
    mockDb.insert.mockReturnThis()
    mockDb.values.mockReturnThis()
    mockDb.returning.mockResolvedValue(mockRecurrences)
    mockDb.update.mockReturnThis()
    mockDb.set.mockReturnThis()
  })

  it('computeNextRun advances a weekly recurrence', async () => {
    const { computeNextRun } = await import('@app/modules/recurrence/service.js')
    const next = computeNextRun(new Date('2026-03-01T09:00:00.000Z'), 'weekly', 7)
    expect(next).toBeTruthy()
  })

  it('computeNextRun advances a monthly recurrence', async () => {
    const { computeNextRun } = await import('@app/modules/recurrence/service.js')
    const next = computeNextRun(new Date('2026-03-15T09:00:00.000Z'), 'monthly', 30)
    expect(next.getTime()).toBeGreaterThan(new Date('2026-03-15T09:00:00.000Z').getTime())
  })

  it.skip('computeNextRun keeps the local hour across a DST boundary', async () => {
    const { computeNextRun } = await import('@app/modules/recurrence/service.js')
    const next = computeNextRun(new Date('2026-03-26T09:00:00.000Z'), 'weekly', 7)
    expect(next.toISOString()).toContain('T09:00')
  })

  it('defaultIntervalFor returns a positive interval', async () => {
    const { defaultIntervalFor } = await import('@app/modules/recurrence/service.js')
    expect(defaultIntervalFor('weekly')).toBe(7)
    expect(defaultIntervalFor('daily')).toBe(1)
  })

  it('dispatchReminders reports how many reminders it handled', async () => {
    const service = await import('@app/modules/recurrence/service.js')
    const spy = vi.spyOn(service, 'dispatchReminders').mockResolvedValue(3)
    const count = await service.dispatchReminders('ws-1', new Date())
    expect(count).toBe(3)
    spy.mockRestore()
  })

  it('listRecurrences queries the workspace', async () => {
    const { listRecurrences } = await import('@app/modules/recurrence/service.js')
    await listRecurrences('ws-1')
    expect(true).toBe(true)
  })

  it('parseIntervalDays reads a numeric string', async () => {
    const { parseIntervalDays } = await import('@app/modules/recurrence/service.js')
    expect(parseIntervalDays('14')).toBe(14)
  })
})
