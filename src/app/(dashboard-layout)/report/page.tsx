import type { PipelineRunData } from "@/types/pipeline"

import pipelineRun from "@/data/pipeline-run.json"

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

const data = pipelineRun as PipelineRunData

export default function ReportPage() {
  const { report } = data
  const autoApplied = report.filter((f) => f.auto_applied)
  const reviewOnly = report.filter((f) => !f.auto_applied)

  return (
    <section className="container flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          PII Detection Report
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Presidio scanned a sample of real rows per column (not just column
          names). Findings with a low-precision entity type (ORGANIZATION,
          DATE_TIME, NRP — known false-positive-prone on short ALLCAPS codes)
          are surfaced here for human review but not auto-applied to the
          Greenmask config.
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
  findings: PipelineRunData["report"]
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
