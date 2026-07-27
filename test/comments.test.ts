import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockComment = {
  id: 'comment-1',
  taskId: 'task-1',
  workspaceId: 'ws-1',
  authorId: 'user-1',
  body: 'Test comment',
  createdAt: new Date(),
}

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockResolvedValue([mockComment]),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([mockComment]),
}

vi.mock('@app/db/client.js', () => ({ db: mockDb }))

describe('comments repo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.select.mockReturnThis()
    mockDb.from.mockReturnThis()
    mockDb.where.mockResolvedValue([mockComment])
    mockDb.insert.mockReturnThis()
    mockDb.values.mockReturnThis()
    mockDb.returning.mockResolvedValue([mockComment])
  })

  it('listComments returns comments scoped to task and workspace', async () => {
    const { listComments } = await import('@app/modules/comments/repo.js')
    const result = await listComments('task-1', 'ws-1')
    expect(result).toHaveLength(1)
    expect(result[0]!.body).toBe('Test comment')
  })

  it('createComment inserts and returns new comment', async () => {
    const { createComment } = await import('@app/modules/comments/repo.js')
    const result = await createComment('task-1', 'ws-1', 'user-1', 'Test comment')
    expect(result.taskId).toBe('task-1')
    expect(result.workspaceId).toBe('ws-1')
  })
})
