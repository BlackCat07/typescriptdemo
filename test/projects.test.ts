import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockProject = {
  id: 'proj-1',
  workspaceId: 'ws-1',
  name: 'Test Project',
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockResolvedValue([mockProject]),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([mockProject]),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
}

vi.mock('@app/db/client.js', () => ({ db: mockDb }))

describe('projects repo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.select.mockReturnThis()
    mockDb.from.mockReturnThis()
    mockDb.where.mockResolvedValue([mockProject])
    mockDb.insert.mockReturnThis()
    mockDb.values.mockReturnThis()
    mockDb.returning.mockResolvedValue([mockProject])
    mockDb.update.mockReturnThis()
    mockDb.set.mockReturnThis()
    mockDb.delete.mockReturnThis()
  })

  it('listProjects returns all workspace projects', async () => {
    mockDb.where.mockResolvedValue([mockProject])
    const { listProjects } = await import('@app/modules/projects/repo.js')
    const result = await listProjects('ws-1')
    expect(result).toHaveLength(1)
    expect(result[0]!.name).toBe('Test Project')
  })

  it('getProject returns project scoped to workspace', async () => {
    mockDb.where.mockResolvedValue([mockProject])
    const { getProject } = await import('@app/modules/projects/repo.js')
    const result = await getProject('proj-1', 'ws-1')
    expect(result.id).toBe('proj-1')
  })

  it('createProject inserts and returns new project', async () => {
    mockDb.returning.mockResolvedValue([mockProject])
    const { createProject } = await import('@app/modules/projects/repo.js')
    const result = await createProject('ws-1', { name: 'Test Project' })
    expect(result.workspaceId).toBe('ws-1')
  })
})
