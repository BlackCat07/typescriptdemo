import { z } from 'zod'

export const TaskCreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.string().uuid(),
})

export const TaskUpdateSchema = TaskCreateSchema.partial()

export const TaskListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict()

export const TaskListMetaSchema = z.object({
  page: z.number().int().min(0),
  limit: z.number().int().min(1),
  count: z.number().int().min(0),
})

export type TaskCreate = z.infer<typeof TaskCreateSchema>
export type TaskUpdate = z.infer<typeof TaskUpdateSchema>
export type TaskListQuery = z.infer<typeof TaskListQuerySchema>
export type TaskListMeta = z.infer<typeof TaskListMetaSchema>
