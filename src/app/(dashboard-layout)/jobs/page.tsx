"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import type { Job } from "@/lib/jobs-api"

import { STEP_LABELS, listJobs } from "@/lib/jobs-api"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

function jobDuration(j: Job): string {
  if (!j.started_at) return "—"
  const end = j.finished_at ? new Date(j.finished_at).getTime() : Date.now()
  return formatDuration((end - new Date(j.started_at).getTime()) / 1000)
}

export default function JobsHistoryPage() {
  const [jobs, setJobs] = useState<Job[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listJobs()
      .then(setJobs)
      .catch((e) => setError(String(e)))
  }, [])

  return (
    <section className="container flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            История задач
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Все прогоны санитизации через API — своих и чужих, без авторизации
            (см. известные ограничения MVP).
          </p>
        </div>
        <Button asChild>
          <Link href="/jobs/new">Новая задача</Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Не удалось связаться с jobs API</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {jobs && jobs.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Пока ни одной задачи — начни с «Новая задача».
        </p>
      )}

      {jobs && jobs.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Источник</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Длительность</TableHead>
              <TableHead>Создан</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((j) => (
              <TableRow key={j.id}>
                <TableCell className="font-mono text-xs">
                  <Link href={`/jobs/${j.id}`} className="underline">
                    {j.id.slice(0, 8)}
                  </Link>
                </TableCell>
                <TableCell>{j.source_id}</TableCell>
                <TableCell>
                  {j.status === "done" ? (
                    <Badge>готово</Badge>
                  ) : j.status === "error" ? (
                    <Badge variant="destructive">ошибка</Badge>
                  ) : (
                    <Badge variant="secondary">{STEP_LABELS[j.status]}</Badge>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {jobDuration(j)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(j.created_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  )
}
