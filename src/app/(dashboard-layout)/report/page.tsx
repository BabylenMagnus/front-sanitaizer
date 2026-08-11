import Link from "next/link"

import type { Finding } from "@/lib/jobs-api"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const dynamic = "force-dynamic"

const JOBS_API_URL = process.env.JOBS_API_URL || "http://localhost:8000"
const INTERNAL_SECRET =
  process.env.JOBS_INTERNAL_SECRET || "dev-shared-secret-local"

interface LatestJob {
  id: string
  created_at: string
  result: { source_label: string; findings: Finding[] } | null
}

async function getLatestJob(): Promise<LatestJob | null> {
  const res = await fetch(`${JOBS_API_URL}/api/jobs/latest`, {
    headers: {
      "X-Internal-Secret": INTERNAL_SECRET,
      "X-User-Id": "public-report",
      "X-User-Role": "admin",
    },
    cache: "no-store",
  })
  if (!res.ok) return null
  return res.json()
}

export default async function ReportPage() {
  const job = await getLatestJob()

  if (!job || !job.result) {
    return (
      <section className="container flex flex-col gap-6 p-4">
        <Alert>
          <AlertTitle>Пока нет завершённых прогонов</AlertTitle>
          <AlertDescription>
            Эта страница показывает отчёт последнего успешного job&apos;а из{" "}
            <Link href="/jobs/new" className="underline">
              /jobs/new
            </Link>
            . Запусти прогон — отчёт появится здесь.
          </AlertDescription>
        </Alert>
      </section>
    )
  }

  const { findings } = job.result
  const autoApplied = findings.filter((f) => f.auto_applied)
  const reviewOnly = findings.filter((f) => !f.auto_applied)

  return (
    <section className="container flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          PII Detection Report
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Latest completed run: {job.result.source_label},{" "}
          {new Date(job.created_at).toLocaleString()}. Presidio scanned a sample
          of real rows per column (not just column names). Findings with a
          low-precision entity type (ORGANIZATION, DATE_TIME, NRP — known
          false-positive-prone on short ALLCAPS codes) are surfaced here for
          human review but not auto-applied to the Greenmask config.
        </p>
      </div>

      <FindingsTable
        title={`Auto-applied (${autoApplied.length})`}
        description="Wired into Greenmask's Cmd transformer — these columns are sanitized on every dump."
        findings={autoApplied}
      />

      <FindingsTable
        title={`Review-only (${reviewOnly.length})`}
        description="Flagged as PII candidates but not auto-applied — needs a human decision before masking."
        findings={reviewOnly}
      />
    </section>
  )
}

function FindingsTable({
  title,
  description,
  findings,
}: {
  title: string
  description: string
  findings: Finding[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table</TableHead>
              <TableHead>Column</TableHead>
              <TableHead>Entity type</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Hit ratio</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Identity-linked</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {findings.map((f) => (
              <TableRow key={`${f.schema}.${f.table}.${f.column}`}>
                <TableCell className="font-mono text-xs">
                  {f.schema}.{f.table}
                </TableCell>
                <TableCell className="font-mono text-xs">{f.column}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{f.entity_type}</Badge>
                </TableCell>
                <TableCell className="uppercase">{f.language}</TableCell>
                <TableCell>{f.hit_ratio}</TableCell>
                <TableCell className="text-muted-foreground">
                  {f.source}
                </TableCell>
                <TableCell>
                  {f.identity_linked ? (
                    <Badge>yes</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
