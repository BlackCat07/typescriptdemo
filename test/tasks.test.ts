import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRows = [
  {
    id: 'task-1',
    projectId: 'proj-1',
    workspaceId: 'ws-1',
    title: 'Test task',
    description: null,
    status: 'todo',
    assigneeId: null,
    dueDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockResolvedValue(mockRows),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue(mockRows),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
}

vi.mock('@app/db/client.js', () => ({ db: mockDb }))

describe('tasks repo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.select.mockReturnThis()
    mockDb.from.mockReturnThis()
    mockDb.where.mockReturnThis()
    mockDb.limit.mockReturnThis()
    mockDb.offset.mockResolvedValue(mockRows)
    mockDb.insert.mockReturnThis()
    mockDb.values.mockReturnThis()
    mockDb.returning.mockResolvedValue(mockRows)
    mockDb.update.mockReturnThis()
    mockDb.set.mockReturnThis()
    mockDb.delete.mockReturnThis()
  })

  it('listTasks returns rows for a project', async () => {
    mockDb.offset.mockResolvedValue(mockRows)
    const { listTasks } = await import('@app/modules/tasks/repo.js')
    const result = await listTasks('proj-1', 'ws-1', { page: 0, limit: 50 })
    expect(result).toEqual(mockRows)
  })

  it('listTasks page 0 applies zero offset', async () => {
    mockDb.offset.mockResolvedValue([])
    const { listTasks } = await import('@app/modules/tasks/repo.js')
    await listTasks('proj-1', 'ws-1', { page: 0, limit: 10 })
    expect(mockDb.offset).toHaveBeenCalledWith(0)
  })

  it('createTask inserts and returns the new task', async () => {
    mockDb.returning.mockResolvedValue(mockRows)
    const { createTask } = await import('@app/modules/tasks/repo.js')
    const result = await createTask('proj-1', 'ws-1', { title: 'New task', status: 'todo' })
    expect(result.title).toBe('Test task')
  })
})
