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

export interface StepTiming {
  started_at: string
  finished_at?: string
  duration_seconds?: number
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
  started_at: string | null
  finished_at: string | null
  step_timings: Record<string, StepTiming>
}

async function unwrap<T>(res: Response): Promise<T> {
  if (res.status === 401) throw new Error("не авторизован — зайди на /login")
  if (!res.ok) throw new Error(`запрос не выполнен: ${res.status}`)
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

export interface JobTable {
  schema: string
  table: string
  row_count: number
  changed: boolean
}

export async function listJobTables(jobId: string): Promise<JobTable[]> {
  return unwrap(await fetch(`/api/jobs/${jobId}/tables`))
}

export interface TablePreview {
  columns: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  original_rows: Record<string, any>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transformed_rows: Record<string, any>[]
}

export async function previewJobTable(
  jobId: string,
  table: string,
  limit = 20
): Promise<TablePreview> {
  const qs = new URLSearchParams({ table, limit: String(limit) })
  return unwrap(await fetch(`/api/jobs/${jobId}/preview?${qs.toString()}`))
}

/** Not a fetch wrapper — this is a plain URL for an `<a href>` download
 * link. The browser's own cookie-based session auth covers it the same as
 * any same-origin navigation; no need to route it through fetch/unwrap. */
export function jobTableExportUrl(jobId: string, table: string): string {
  const qs = new URLSearchParams({ table })
  return `/api/jobs/${jobId}/export?${qs.toString()}`
}

/** Drops the job's sanitized-copy database entirely — irreversible, meant
 * to be called right after the user has exported what they needed. The job
 * row, logs, and findings summary stay around; only the data is gone. */
export async function deleteJobTarget(jobId: string): Promise<void> {
  await unwrap(await fetch(`/api/jobs/${jobId}/target`, { method: "DELETE" }))
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
  queued: "В очереди",
  detecting: "Поиск PII (Presidio)",
  generating: "Генерация замен (LangGraph)",
  dumping: "Дамп с санитизацией (Greenmask)",
  restoring: "Восстановление в новую БД (Greenmask)",
  done: "Готово",
  error: "Ошибка",
}

export const STEP_ORDER: Job["status"][] = [
  "queued",
  "detecting",
  "generating",
  "dumping",
  "restoring",
  "done",
]
