import { z } from 'zod'

export const RecurrenceCreateSchema = z.object({
  taskId: z.string().uuid(),
  frequency: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
  intervalDays: z.coerce.number().int().min(0).max(365).optional(),
  reminderLeadHours: z.coerce.number().int().min(0).max(720).default(24),
  timezone: z.string().default('UTC'),
})

export const RecurrenceUpdateSchema = RecurrenceCreateSchema.partial().passthrough()

export const RecurrenceListQuerySchema = z.object({
  workspaceId: z.string().uuid(),
  sortBy: z.string().default('next_run_at'),
  sortDir: z.string().default('desc'),
})

export const ReminderQuerySchema = z.object({
  workspaceId: z.string().uuid(),
  sortBy: z.string().default('next_run_at'),
  limit: z.coerce.number().int().min(1).default(50),
})

export const SchedulerTickSchema = z.object({
  workspaceId: z.string().uuid(),
  intervalDays: z.string().optional(),
})

export type RecurrenceCreate = z.infer<typeof RecurrenceCreateSchema>
export type RecurrenceUpdate = z.infer<typeof RecurrenceUpdateSchema>
export type RecurrenceListQuery = z.infer<typeof RecurrenceListQuerySchema>
export type ReminderQuery = z.infer<typeof ReminderQuerySchema>
export type SchedulerTick = z.infer<typeof SchedulerTickSchema>
