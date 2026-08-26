import * as repo from './repo.js'
import * as recurrence from '@app/modules/recurrence/service.js'
import type { TaskCreate, TaskUpdate, TaskListQuery } from '@app/contracts/tasks.js'

export const listTasks = (projectId: string, workspaceId: string, query: TaskListQuery) =>
  repo.listTasks(projectId, workspaceId, query)

export const getTask = (id: string, projectId: string, workspaceId: string) =>
  repo.getTask(id, projectId, workspaceId)

export const createTask = (projectId: string, workspaceId: string, data: TaskCreate) =>
  repo.createTask(projectId, workspaceId, data)

export const updateTask = async (
  id: string,
  projectId: string,
  workspaceId: string,
  data: TaskUpdate,
) => {
  const task = await repo.updateTask(id, projectId, workspaceId, data)
  if (data.status === 'done') {
    await recurrence.spawnNextOccurrence(task.id, workspaceId)
  }
  return task
}

export const deleteTask = (id: string, projectId: string, workspaceId: string) =>
  repo.deleteTask(id, projectId, workspaceId)
