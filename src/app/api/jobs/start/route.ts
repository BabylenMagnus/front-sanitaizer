import { NextResponse } from "next/server"

import {
  UnauthorizedError,
  jobsApiUrl,
  requireSessionHeaders,
} from "@/lib/jobs-backend"

export async function POST(req: Request) {
  try {
    const authHeaders = await requireSessionHeaders()
    const body = await req.text()
    const res = await fetch(jobsApiUrl("/api/jobs/start"), {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body,
    })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    throw e
  }
}
