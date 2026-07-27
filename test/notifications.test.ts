import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockTask = {
  id: 'task-1',
  projectId: 'proj-1',
  workspaceId: 'ws-1',
  title: 'Test task',
  description: null,
  status: 'todo',
  assigneeId: 'user-1',
  dueDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([mockTask]),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockResolvedValue([]),
}

vi.mock('@app/db/client.js', () => ({ db: mockDb }))
vi.mock('@app/adapters/mailer.js', () => ({
  mailer: { send: vi.fn().mockResolvedValue(undefined) },
}))

describe('notifications repo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.select.mockReturnThis()
    mockDb.from.mockReturnThis()
    mockDb.where.mockReturnThis()
    mockDb.orderBy.mockReturnThis()
    mockDb.limit.mockResolvedValue([mockTask])
    mockDb.insert.mockReturnThis()
    mockDb.values.mockResolvedValue([])
  })

  it('getPendingNotifications returns notifications for assigned tasks', async () => {
    const { getPendingNotifications } = await import('@app/modules/notifications/repo.js')
    const result = await getPendingNotifications('user-1', 'ws-1')
    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result[0]!.taskId).toBe('task-1')
  })

  it('markDigestSent inserts when no existing record', async () => {
    mockDb.limit.mockResolvedValue([])
    const { markDigestSent } = await import('@app/modules/notifications/repo.js')
    const result = await markDigestSent('user-1', 'ws-1')
    expect(result).toBe(true)
  })
})

describe('notifications service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.select.mockReturnThis()
    mockDb.from.mockReturnThis()
    mockDb.where.mockReturnThis()
    mockDb.orderBy.mockReturnThis()
    mockDb.limit.mockResolvedValue([mockTask])
    mockDb.insert.mockReturnThis()
    mockDb.values.mockResolvedValue([])
  })

  it('getNotifications returns an array', async () => {
    const { getNotifications } = await import('@app/modules/notifications/service.js')
    const result = await getNotifications('user-1', 'ws-1')
    expect(Array.isArray(result)).toBe(true)
  })

  it('getNotificationCount returns a number', async () => {
    const { getNotificationCount } = await import('@app/modules/notifications/service.js')
    const count = await getNotificationCount('user-1', 'ws-1')
    expect(typeof count).toBe('number')
  })
})
