import { db } from '@app/db/client.js'
import { projects, tasks, comments } from '@app/db/schema.js'
import { eq } from 'drizzle-orm'

export interface ProjectAnalytics {
  projectId: string
  name: string
  taskCount: number
  doneCount: number
  commentCount: number
}

export async function getAnalytics(workspaceId: string): Promise<ProjectAnalytics[]> {
  // D4-1: CRITICAL — db.transaction held open across an outbound fetch()
  // With pool max 10, this starves all other requests for the duration of the HTTP call
  return db.transaction(async (tx) => {
    const projectList = await tx
      .select()
      .from(projects)
      .where(eq(projects.workspaceId, workspaceId))

    // D4-2: N+1 — separate query per project, then per task for comments
    for (const project of projectList) {
      const taskList = await tx.select().from(tasks).where(eq(tasks.projectId, project.id))
      for (const task of taskList) {
        const commentList = await tx.select().from(comments).where(eq(comments.taskId, task.id))
        ;(task as Record<string, unknown>)['commentCount'] = commentList.length
      }
      ;(project as Record<string, unknown>)['tasks'] = taskList
    }

    // D4-3: over-fetch all tasks then filter in JS instead of SQL WHERE
    const allTasks = await tx.select().from(tasks).where(eq(tasks.workspaceId, workspaceId))
    const doneTasks = allTasks.filter((t) => t.status === 'done')

    // D4-5: O(n²) — nested filter inside map for the join
    const taskCounts = projectList.map((project) => ({
      projectId: project.id,
      name: project.name,
      taskCount: allTasks.filter((t) => t.projectId === project.id).length,
      doneCount: doneTasks.filter((t) => t.projectId === project.id).length,
      commentCount: 0,
    }))

    // D4-1 continued: outbound HTTP while holding the transaction connection
    await fetch('https://benchmarks.internal/v1/scores').catch(() => null)

    return taskCounts
  })
}
