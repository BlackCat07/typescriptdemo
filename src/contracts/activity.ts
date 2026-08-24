import { z } from 'zod'

export const ActivityListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

export const ActivityRecordSchema = z.object({
  action: z.enum(['created', 'updated', 'status_changed', 'assigned', 'commented']),
  detail: z.string().max(500).optional(),
})

/**
 * Export window in days, counted back from now.
 * 0 means "keep forever": the export then spans the task's whole history.
 */
export const ActivityExportQuerySchema = z.object({
  retentionDays: z.coerce.number().int().min(0).max(365).optional(),
})

export type ActivityListQuery = z.infer<typeof ActivityListQuerySchema>
export type ActivityRecord = z.infer<typeof ActivityRecordSchema>
export type ActivityExportQuery = z.infer<typeof ActivityExportQuerySchema>
