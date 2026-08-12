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
    const qs = new URLSearchParams({ table })
    const res = await fetch(
      jobsApiUrl(`/api/jobs/${id}/export?${qs.toString()}`),
      { headers: authHeaders }
    )
    if (!res.ok) {
      return NextResponse.json(
        { error: `export failed: ${res.status}` },
        { status: res.status }
      )
    }
    // Pass the CSV bytes and download headers straight through — this
    // route exists only to inject the trusted internal headers, not to
    // touch the file's content.
    return new NextResponse(res.body, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "text/csv",
        "Content-Disposition":
          res.headers.get("Content-Disposition") || "attachment",
      },
    })
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    throw e
  }
}
