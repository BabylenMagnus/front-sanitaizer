"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import type { Job, JobTable, TablePreview } from "@/lib/jobs-api"

import {
  STEP_LABELS,
  STEP_ORDER,
  deleteJobTarget,
  getJob,
  jobTableExportUrl,
  listJobTables,
  previewJobTable,
} from "@/lib/jobs-api"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}с`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}м ${s}с`
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const logsRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    async function poll() {
      try {
        const j = await getJob(params.id)
        if (cancelled) return
        setJob(j)
        setError(null)
        if (j.status !== "done" && j.status !== "error") {
          timer = setTimeout(poll, 2000)
        }
      } catch (e) {
        if (!cancelled) {
          setError(String(e))
          timer = setTimeout(poll, 3000)
        }
      }
    }
    poll()

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [params.id])

  useEffect(() => {
    logsRef.current?.scrollTo({ top: logsRef.current.scrollHeight })
  }, [job?.logs])

  const currentStepIndex = job ? STEP_ORDER.indexOf(job.status) : -1
  const isRunning = job && job.status !== "done" && job.status !== "error"
  const sinceUpdateSeconds = job
    ? Math.max(0, (now - new Date(job.updated_at).getTime()) / 1000)
    : 0
  const totalSeconds = job?.started_at
    ? ((job.finished_at ? new Date(job.finished_at).getTime() : now) -
        new Date(job.started_at).getTime()) /
      1000
    : null

  return (
    <section className="container flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Задача</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {params.id}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Не удалось получить статус</AlertTitle>
          <AlertDescription>{error} — повторяю запрос…</AlertDescription>
        </Alert>
      )}

      {!job && !error && (
        <p className="text-sm text-muted-foreground">Загружаю job…</p>
      )}

      {job && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {STEP_LABELS[job.status]}
                <StatusBadge status={job.status} />
              </CardTitle>
              <CardDescription>
                Источник: {job.source_id}
                {totalSeconds !== null && (
                  <>
                    {" "}
                    · {job.finished_at ? "заняло" : "идёт"}{" "}
                    {formatDuration(totalSeconds)}
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1">
                {STEP_ORDER.map((step, i) => (
                  <div
                    key={step}
                    className={`h-1.5 flex-1 rounded-full ${
                      i <= currentStepIndex && job.status !== "error"
                        ? "bg-primary"
                        : "bg-muted"
                    } ${job.status === "error" ? "bg-destructive/60" : ""}`}
                    title={STEP_LABELS[step]}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Шаг {Math.max(currentStepIndex, 0) + 1} из {STEP_ORDER.length}
                  : пайплайн выполняется целиком (detector → generator → dump →
                  restore), прогресс — по шагам, не по таблицам внутри шага.
                </span>
              </div>
              {isRunning && (
                <p className="mt-1 text-xs">
                  {sinceUpdateSeconds < 20 ? (
                    <span className="text-emerald-500">
                      ● живой процесс — активность{" "}
                      {Math.round(sinceUpdateSeconds)}с назад
                    </span>
                  ) : (
                    <span className="text-amber-500">
                      ● нет обновлений уже {formatDuration(sinceUpdateSeconds)}{" "}
                      — возможно, зависло
                    </span>
                  )}
                </p>
              )}

              <div className="mt-4 flex flex-col gap-1.5 border-t pt-3">
                {STEP_ORDER.filter((s) => s !== "queued" && s !== "done").map(
                  (step) => {
                    const t = job.step_timings?.[step]
                    return (
                      <div
                        key={step}
                        className="flex items-center justify-between text-xs"
                      >
                        <span
                          className={
                            job.status === step
                              ? "font-medium text-foreground"
                              : "text-muted-foreground"
                          }
                        >
                          {STEP_LABELS[step]}
                        </span>
                        <span className="font-mono text-muted-foreground">
                          {t?.duration_seconds !== undefined
                            ? formatDuration(t.duration_seconds)
                            : t?.started_at
                              ? `${formatDuration(
                                  (now - new Date(t.started_at).getTime()) /
                                    1000
                                )}…`
                              : "—"}
                        </span>
                      </div>
                    )
                  }
                )}
              </div>
            </CardContent>
          </Card>

          {job.status === "error" && (
            <Alert variant="destructive">
              <AlertTitle>Не удалось завершить санитизацию</AlertTitle>
              <AlertDescription>
                {job.error_message || "Причина не указана — смотри логи ниже."}
              </AlertDescription>
            </Alert>
          )}

          {job.status === "done" && job.result && (
            <Card>
              <CardHeader>
                <CardTitle>Результат</CardTitle>
                <CardDescription>
                  {job.result.source_label}: {job.result.auto_applied_count}{" "}
                  колонок санитизировано автоматически,{" "}
                  {job.result.review_only_count} оставлено на ручное ревью.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Таблица</TableHead>
                      <TableHead>Колонка</TableHead>
                      <TableHead>Тип PII</TableHead>
                      <TableHead>Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {job.result.findings.map((f, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">
                          {f.schema}.{f.table}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {f.column}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{f.entity_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {f.auto_applied ? (
                            <Badge>применено</Badge>
                          ) : (
                            <Badge variant="secondary">на проверку</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {job.status === "done" && <TablesBrowser jobId={job.id} />}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Логи</CardTitle>
              <CardDescription>
                Живой stdout/stderr каждого шага пайплайна, по мере выполнения.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre
                ref={logsRef}
                className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs"
              >
                {job.logs || "(пока пусто)"}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </section>
  )
}

function StatusBadge({ status }: { status: Job["status"] }) {
  if (status === "done") return <Badge>готово</Badge>
  if (status === "error") return <Badge variant="destructive">ошибка</Badge>
  return <Badge variant="secondary">выполняется</Badge>
}

function TablesBrowser({ jobId }: { jobId: string }) {
  const [tables, setTables] = useState<JobTable[] | null>(null)
  const [tablesError, setTablesError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [preview, setPreview] = useState<TablePreview | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [deleteConfirming, setDeleteConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteAfterExport, setDeleteAfterExport] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    listJobTables(jobId)
      .then((list) => {
        setTables(list)
        const firstChanged = list.find((t) => t.changed) ?? list[0]
        if (firstChanged)
          setSelected(`${firstChanged.schema}.${firstChanged.table}`)
      })
      .catch((e) => {
        // 410 means the data was already deleted (manually, or by the
        // 1-day/low-disk cleanup job) — show that plainly, not as an error.
        if (String(e).includes("410")) setDeleted(true)
        else setTablesError(String(e))
      })
  }, [jobId])

  async function handleExport() {
    if (!selected) return
    setExporting(true)
    setDeleteError(null)
    try {
      const res = await fetch(jobTableExportUrl(jobId, selected))
      if (!res.ok) throw new Error(`не удалось скачать: ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${selected.replace(".", "_")}_sanitized.csv`
      a.click()
      URL.revokeObjectURL(url)

      if (deleteAfterExport) await handleDelete()
    } catch (e) {
      setDeleteError(String(e))
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteJobTarget(jobId)
      setDeleted(true)
      setTables(null)
      setPreview(null)
      setSelected(null)
    } catch (e) {
      setDeleteError(String(e))
    } finally {
      setDeleting(false)
      setDeleteConfirming(false)
    }
  }

  useEffect(() => {
    if (!selected) return
    setPreviewLoading(true)
    setPreviewError(null)
    previewJobTable(jobId, selected, 20)
      .then(setPreview)
      .catch((e) => setPreviewError(String(e)))
      .finally(() => setPreviewLoading(false))
  }, [jobId, selected])

  if (deleted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Таблицы санитизированной базы</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>Данные удалены</AlertTitle>
            <AlertDescription>
              Санитизированная копия для этой задачи удалена — вручную или
              автоматической очисткой (старше суток либо по нехватке места).
              Логи и найденные PII-колонки выше остаются доступны, сами данные —
              нет.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Таблицы санитизированной базы</CardTitle>
        <CardDescription>
          Все таблицы в результате прогона — какие были изменены, какие нет.
          Выбери таблицу, чтобы увидеть строки «до / после», или скачай её
          целиком в CSV. Данные автоматически удаляются через сутки или при
          нехватке места на диске — если больше не нужны, можно удалить сразу.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {tablesError && (
          <Alert variant="destructive">
            <AlertTitle>Не удалось загрузить список таблиц</AlertTitle>
            <AlertDescription>{tablesError}</AlertDescription>
          </Alert>
        )}

        {tables && (
          <div className="flex flex-wrap gap-1.5">
            {tables.map((t) => {
              const key = `${t.schema}.${t.table}`
              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                    selected === key
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <span className="font-mono">{key}</span>
                  <span className="text-muted-foreground">({t.row_count})</span>
                  {t.changed ? (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                      изменено
                    </Badge>
                  ) : null}
                </button>
              )
            })}
          </div>
        )}

        {selected && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
            <span className="font-mono text-xs text-muted-foreground">
              {selected}
            </span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={deleteAfterExport}
                  onChange={(e) => setDeleteAfterExport(e.target.checked)}
                />
                удалить данные сразу после скачивания
              </label>
              <Button
                size="sm"
                variant="outline"
                disabled={exporting}
                onClick={handleExport}
              >
                {exporting ? "Скачиваю…" : "Скачать CSV"}
              </Button>
            </div>
          </div>
        )}

        {previewError && (
          <Alert variant="destructive">
            <AlertTitle>Не удалось загрузить превью</AlertTitle>
            <AlertDescription>{previewError}</AlertDescription>
          </Alert>
        )}

        {previewLoading && (
          <p className="text-sm text-muted-foreground">Загружаю превью…</p>
        )}

        {preview && !previewLoading && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                Исходные данные
              </p>
              <PreviewTable
                columns={preview.columns}
                rows={preview.original_rows}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                После трансформации
              </p>
              <PreviewTable
                columns={preview.columns}
                rows={preview.transformed_rows}
              />
            </div>
          </div>
        )}

        {deleteError && (
          <Alert variant="destructive">
            <AlertTitle>Не удалось удалить данные</AlertTitle>
            <AlertDescription>{deleteError}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end border-t pt-3">
          {!deleteConfirming ? (
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteConfirming(true)}
            >
              Удалить санитизированные данные
            </Button>
          ) : (
            <div className="flex items-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-3">
              <span className="text-sm">
                Удалить все санитизированные данные этой задачи безвозвратно?
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirming(false)}
                  disabled={deleting}
                >
                  Отмена
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleting}
                  onClick={handleDelete}
                >
                  {deleting ? "Удаляю…" : "Удалить"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function PreviewTable({
  columns,
  rows,
}: {
  columns: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: Record<string, any>[]
}) {
  return (
    <div className="max-h-96 overflow-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c} className="font-mono text-xs">
                {c}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {columns.map((c) => (
                <TableCell key={c} className="font-mono text-xs">
                  {String(row[c])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
