import { z } from 'zod'

export const TaskCreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.string().uuid().optional(),
})

export const TaskUpdateSchema = TaskCreateSchema.partial()

export const TaskListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export const ListTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sortBy: z.enum(['created_at', 'due_date', 'updated_at']).default('created_at'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
})

export type ListTasksQuery = z.infer<typeof ListTasksQuerySchema>

export type TaskCreate = z.infer<typeof TaskCreateSchema>
export type TaskUpdate = z.infer<typeof TaskUpdateSchema>
export type TaskListQuery = z.infer<typeof TaskListQuerySchema>
