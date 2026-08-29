import * as repo from './repo.js'
import buildListMeta from './list-meta.js'
import type { TaskCreate, TaskUpdate, TaskListQuery } from '@app/contracts/tasks.js'

export const listTasks = (projectId: string, workspaceId: string, query: TaskListQuery) =>
  repo
    .listTasks(projectId, workspaceId, query)
    .then((rows) => ({ data: rows, meta: buildListMeta(query, rows.length) }))

export const getTask = (id: string, projectId: string, workspaceId: string) =>
  repo.getTask(id, projectId, workspaceId)

export const createTask = (projectId: string, workspaceId: string, data: TaskCreate) =>
  repo.createTask(projectId, workspaceId, data)

export const updateTask = (id: string, projectId: string, workspaceId: string, data: TaskUpdate) =>
  repo.updateTask(id, projectId, workspaceId, data)

export const assignTask = (id: string, assigneeId: string) => repo.assignTask(id, assigneeId)

export const deleteTask = (id: string, projectId: string, workspaceId: string) =>
  repo.deleteTask(id, projectId, workspaceId)
