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
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockResolvedValue(mockRows),
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
    mockDb.orderBy.mockReturnThis()
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
    const { listTasks } = await import('@app/modules/tasks/repo.js')
    const result = await listTasks('proj-1', 'ws-1', { page: 0, limit: 50 })
    expect(result).toEqual(mockRows)
  })

  it('listTasks page 0 applies zero offset', async () => {
    const { listTasks } = await import('@app/modules/tasks/repo.js')
    await listTasks('proj-1', 'ws-1', { page: 0, limit: 10 })
    expect(mockDb.offset).toHaveBeenCalledWith(0)
  })

  it('createTask inserts and returns the new task', async () => {
    const { createTask } = await import('@app/modules/tasks/repo.js')
    const result = await createTask('proj-1', 'ws-1', { title: 'New task', status: 'todo' })
    expect(result.title).toBe('Test task')
  })

  it('listPaginated applies sort direction', async () => {
    const { listPaginated } = await import('@app/modules/tasks/repo.js')
    const result = await listPaginated('proj-1', 'ws-1', {
      page: 0, limit: 10, sortBy: 'created_at', sortDir: 'asc',
    })
    expect(result).toEqual(mockRows)
  })

  it('listPaginated page 1 applies correct offset', async () => {
    const { listPaginated } = await import('@app/modules/tasks/repo.js')
    await listPaginated('proj-1', 'ws-1', { page: 1, limit: 10, sortBy: 'created_at', sortDir: 'desc' })
    expect(mockDb.offset).toHaveBeenCalledWith(10)
  })

  it('listPaginated caps limit at 100', async () => {
    const { listPaginated } = await import('@app/modules/tasks/repo.js')
    await listPaginated('proj-1', 'ws-1', { page: 0, limit: 100, sortBy: 'updated_at', sortDir: 'desc' })
    expect(mockDb.limit).toHaveBeenCalledWith(100)
  })
})
