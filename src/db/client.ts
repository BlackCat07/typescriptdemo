import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@app/db/schema.js'

const pool = postgres(process.env['DATABASE_URL'] ?? 'postgres://dev:dev@localhost:5432/typescript_demo', {
  max: 10,
})

export const db = drizzle(pool, { schema })
export type Db = typeof db
