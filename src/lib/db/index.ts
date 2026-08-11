import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "./schema"

const url =
  process.env.DATABASE_URL ||
  "postgresql://postgres:example@localhost:54316/jobs"

const client = postgres(url, { prepare: false })
export const db = drizzle(client, { schema })
