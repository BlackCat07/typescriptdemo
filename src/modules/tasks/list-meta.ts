import type { TaskListMeta, TaskListQuery } from '@app/contracts/tasks.js'

/** Pagination metadata for a page of tasks that has already been fetched. */
export default function buildListMeta(query: TaskListQuery, count: number): TaskListMeta {
  return {
    page: query.page,
    limit: query.limit,
    count,
  }
}
