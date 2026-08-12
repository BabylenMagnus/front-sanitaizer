import { NextResponse } from "next/server"

import {
  UnauthorizedError,
  jobsApiUrl,
  requireSessionHeaders,
} from "@/lib/jobs-backend"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeaders = await requireSessionHeaders()
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const table = searchParams.get("table") || ""
    const limit = searchParams.get("limit") || "20"
    const qs = new URLSearchParams({ table, limit })
    const res = await fetch(
      jobsApiUrl(`/api/jobs/${id}/preview?${qs.toString()}`),
      { headers: authHeaders }
    )
    return NextResponse.json(await res.json(), { status: res.status })
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    throw e
  }
}
