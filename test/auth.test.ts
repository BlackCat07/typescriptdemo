import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockWorkspace = { id: 'ws-1', name: 'test', slug: 'test', createdAt: new Date() }
const mockUser = {
  id: 'user-1',
  workspaceId: 'ws-1',
  email: 'test@example.com',
  passwordHash: '$2a$10$placeholder',
  name: 'Test User',
  createdAt: new Date(),
}

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockResolvedValue([]),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([mockWorkspace]),
}

vi.mock('@app/db/client.js', () => ({ db: mockDb }))
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2a$10$hashed'),
    compare: vi.fn().mockResolvedValue(true),
  },
}))

describe('auth service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.select.mockReturnThis()
    mockDb.from.mockReturnThis()
    mockDb.where.mockResolvedValue([])
    mockDb.insert.mockReturnThis()
    mockDb.values.mockReturnThis()
    mockDb.returning.mockResolvedValue([mockWorkspace])
  })

  it('registerUser creates workspace and user', async () => {
    // workspace check returns empty (slug available)
    mockDb.where
      .mockResolvedValueOnce([])          // workspace slug check
      .mockResolvedValue([mockUser])       // subsequent queries

    mockDb.returning
      .mockResolvedValueOnce([mockWorkspace]) // workspace insert
      .mockResolvedValueOnce([mockUser])      // user insert
      .mockResolvedValue([{}])                // membership insert

    const { registerUser } = await import('@app/modules/auth/service.js')
    const result = await registerUser({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      workspaceSlug: 'test',
    })
    expect(result.userId).toBe('user-1')
    expect(result.workspaceId).toBe('ws-1')
  })

  it('loginUser returns userId and workspaceId on valid credentials', async () => {
    mockDb.where.mockResolvedValue([mockUser])
    const { loginUser } = await import('@app/modules/auth/service.js')
    const result = await loginUser({ email: 'test@example.com', password: 'password123' })
    expect(result.userId).toBe('user-1')
  })
})
