import { NextResponse } from "next/server"

import {
  UnauthorizedError,
  jobsApiUrl,
  requireSessionHeaders,
} from "@/lib/jobs-backend"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeaders = await requireSessionHeaders()
    const { id } = await params
    const res = await fetch(jobsApiUrl(`/api/jobs/${id}/status`), {
      headers: authHeaders,
    })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    throw e
  }
}
