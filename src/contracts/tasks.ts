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
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  overdue: z.coerce.boolean().optional(),
  dueBefore: z.string().optional(),
})

export type TaskCreate = z.infer<typeof TaskCreateSchema>
export type TaskUpdate = z.infer<typeof TaskUpdateSchema>
export type TaskListQuery = z.infer<typeof TaskListQuerySchema>
