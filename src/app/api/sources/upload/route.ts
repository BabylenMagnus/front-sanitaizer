import { NextResponse } from "next/server"

import {
  UnauthorizedError,
  jobsApiUrl,
  requireSessionHeaders,
} from "@/lib/jobs-backend"

export async function POST(req: Request) {
  try {
    const authHeaders = await requireSessionHeaders()
    // Re-forward the multipart body as-is — buffered in Node's memory here,
    // same 500 MB cap FastAPI enforces. Fine for this pass; a real large-file
    // path would stream straight to storage instead (see api/README.md).
    const formData = await req.formData()
    const res = await fetch(jobsApiUrl("/api/sources/upload"), {
      method: "POST",
      headers: authHeaders,
      body: formData,
    })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    throw e
  }
}
