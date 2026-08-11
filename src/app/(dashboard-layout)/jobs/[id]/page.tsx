"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import type { Job } from "@/lib/jobs-api"

import { STEP_LABELS, STEP_ORDER, getJob } from "@/lib/jobs-api"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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

export default function JobDetailPage() {
  const params = useParams<{ id: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [error, setError] = useState<string | null>(null)
  const logsRef = useRef<HTMLPreElement>(null)

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

  return (
    <section className="container flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Job</h1>
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
                Источник: {job.source_id}. Обновлено:{" "}
                {new Date(job.updated_at).toLocaleString()}
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
              <p className="mt-2 text-xs text-muted-foreground">
                Шаг {Math.max(currentStepIndex, 0) + 1} из {STEP_ORDER.length}:
                пайплайн выполняется целиком (detector → generator → dump →
                restore), прогресс — по шагам, не по таблицам внутри шага — см.
                известные ограничения MVP.
              </p>
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
                            <Badge>auto-applied</Badge>
                          ) : (
                            <Badge variant="secondary">review-only</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

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
  if (status === "done") return <Badge>done</Badge>
  if (status === "error") return <Badge variant="destructive">error</Badge>
  return <Badge variant="secondary">running</Badge>
}
