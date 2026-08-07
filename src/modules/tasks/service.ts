import * as repo from './repo.js'
import type { TaskCreate, TaskUpdate, TaskListQuery, ListTasksQuery } from '@app/contracts/tasks.js'

export const listTasks = (projectId: string, workspaceId: string, query: TaskListQuery) =>
  repo.listTasks(projectId, workspaceId, query)

export const listPaginated = (projectId: string, workspaceId: string, query: ListTasksQuery) =>
  repo.listPaginated(projectId, workspaceId, query)

export const getTask = (id: string, projectId: string, workspaceId: string) =>
  repo.getTask(id, projectId, workspaceId)

export const createTask = (projectId: string, workspaceId: string, data: TaskCreate) =>
  repo.createTask(projectId, workspaceId, data)

export const updateTask = (id: string, projectId: string, workspaceId: string, data: TaskUpdate) =>
  repo.updateTask(id, projectId, workspaceId, data)

export const deleteTask = (id: string, projectId: string, workspaceId: string) =>
  repo.deleteTask(id, projectId, workspaceId)
