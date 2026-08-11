// All calls go to sanitaizer-web's own server routes (src/app/api/*), which
// validate the better-auth session and forward to FastAPI with trusted
// internal headers — the browser never talks to FastAPI directly and never
// sees the internal secret.

export interface JobSource {
  id: string
  slug: string
  label: string
  kind: "docker_local" | "dsn" | "upload"
  status: string
}

export interface Finding {
  schema: string
  table: string
  column: string
  entity_type: string
  hit_ratio: number
  source: string
  sample_size: number
  identity_linked: boolean
  auto_applied: boolean
  language: string
}

export interface JobResult {
  source_label: string
  auto_applied_count: number
  review_only_count: number
  findings: Finding[]
}

export interface Job {
  id: string
  source_id: string
  user_id: string | null
  status:
    | "queued"
    | "detecting"
    | "generating"
    | "dumping"
    | "restoring"
    | "done"
    | "error"
  logs: string
  error_message: string | null
  result: JobResult | null
  created_at: string
  updated_at: string
}

async function unwrap<T>(res: Response): Promise<T> {
  if (res.status === 401) throw new Error("не авторизован — зайди на /login")
  if (!res.ok) throw new Error(`request failed: ${res.status}`)
  return res.json()
}

export async function listSources(): Promise<JobSource[]> {
  return unwrap(await fetch("/api/sources"))
}

export async function startJob(sourceId: string): Promise<{ job_id: string }> {
  return unwrap(
    await fetch("/api/jobs/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_id: sourceId }),
    })
  )
}

export async function getJob(jobId: string): Promise<Job> {
  return unwrap(await fetch(`/api/jobs/${jobId}/status`))
}

export async function listJobs(): Promise<Job[]> {
  return unwrap(await fetch("/api/jobs"))
}

export async function registerDsnSource(input: {
  label: string
  host: string
  port: string
  dbuser: string
  password: string
  dbname: string
}): Promise<{ source_id: string }> {
  return unwrap(
    await fetch("/api/sources/dsn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  )
}

export async function uploadDumpSource(
  label: string,
  file: File
): Promise<{ source_id: string }> {
  const formData = new FormData()
  formData.append("label", label)
  formData.append("file", file)
  return unwrap(
    await fetch("/api/sources/upload", { method: "POST", body: formData })
  )
}

export const STEP_LABELS: Record<Job["status"], string> = {
  queued: "Queued",
  detecting: "Detecting PII (Presidio)",
  generating: "Generating replacements (LangGraph)",
  dumping: "Dumping with sanitization (Greenmask)",
  restoring: "Restoring into transformed DB (Greenmask)",
  done: "Done",
  error: "Error",
}

export const STEP_ORDER: Job["status"][] = [
  "queued",
  "detecting",
  "generating",
  "dumping",
  "restoring",
  "done",
]
