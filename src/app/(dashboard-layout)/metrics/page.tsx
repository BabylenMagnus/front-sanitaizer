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

export default function MetricsPage() {
  const { metrics, rowCounts } = data

  return (
    <section className="container flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Verification Metrics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          From-scratch <code className="text-xs">transformed</code> database,
          clean dump → restore, checked against{" "}
          <code className="text-xs">original</code> right after.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Tables checked" value={metrics.tablesChecked} ok />
        <MetricCard
          label="Row-count mismatches"
          value={metrics.rowCountMismatches}
          ok={metrics.rowCountMismatches === 0}
        />
        <MetricCard
          label="FK constraints restored"
          value={metrics.fkConstraintsRestored}
          detail="0 violations on restore"
          ok
        />
        <MetricCard
          label="City diversity"
          value={`${metrics.diversityTransformed.distinct_city} / ${metrics.diversityOriginal.distinct_city}`}
          detail="distinct values, transformed / original"
          ok={
            metrics.diversityTransformed.distinct_city ===
            metrics.diversityOriginal.distinct_city
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Row counts per table</CardTitle>
          <p className="text-sm text-muted-foreground">
            person / humanresources / sales schemas — every table, not just the
            ones with PII columns.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table</TableHead>
                <TableHead>Original</TableHead>
                <TableHead>Transformed</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rowCounts.map((row) => {
                const ok = row.original_count === row.transformed_count
                return (
                  <TableRow key={row.table_name}>
                    <TableCell className="font-mono text-xs">
                      {row.table_name}
                    </TableCell>
                    <TableCell>{row.original_count}</TableCell>
                    <TableCell>{row.transformed_count}</TableCell>
                    <TableCell>
                      <Badge variant={ok ? "default" : "destructive"}>
                        {ok ? "OK" : "MISMATCH"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  )
}

function MetricCard({
  label,
  value,
  detail,
  ok,
}: {
  label: string
  value: string | number
  detail?: string
  ok: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Badge variant={ok ? "default" : "destructive"}>
            {ok ? "OK" : "CHECK"}
          </Badge>
        </div>
        <p className="text-3xl font-semibold">{value}</p>
      </CardHeader>
      {detail ? (
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">{detail}</p>
        </CardContent>
      ) : null}
    </Card>
  )
}
