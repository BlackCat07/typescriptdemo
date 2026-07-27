function required(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`Environment variable ${name} is required`)
  return val
}

export const config = {
  port: Number(process.env['PORT'] ?? 3000),
  databaseUrl: process.env['DATABASE_URL'] ?? 'postgres://dev:dev@localhost:5432/typescript_demo',
  jwtSecret: process.env['JWT_SECRET'] ?? required('JWT_SECRET'),
} as const
