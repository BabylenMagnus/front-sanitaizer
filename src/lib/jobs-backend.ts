import { headers } from "next/headers"

import { auth } from "@/lib/auth"

const JOBS_API_URL = process.env.JOBS_API_URL || "http://localhost:8000"
const INTERNAL_SECRET =
  process.env.JOBS_INTERNAL_SECRET || "dev-shared-secret-local"

export class UnauthorizedError extends Error {}

/** Validates the better-auth session server-side and returns the trusted
 * headers this API forwards to FastAPI. FastAPI never sees a cookie or a
 * better-auth token — only a caller it already trusts by shared secret,
 * telling it who's asking. */
export async function requireSessionHeaders(): Promise<HeadersInit> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new UnauthorizedError()
  return {
    "X-Internal-Secret": INTERNAL_SECRET,
    "X-User-Id": session.user.id,
    "X-User-Role": (session.user as { role?: string }).role || "user",
  }
}

export function jobsApiUrl(path: string) {
  return `${JOBS_API_URL}${path}`
}
