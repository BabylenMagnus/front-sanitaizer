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
          Метрики верификации
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          База <code className="text-xs">transformed</code>, созданная с нуля,
          чистый dump → restore, сверена с{" "}
          <code className="text-xs">original</code> сразу после.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Проверено таблиц" value={metrics.tablesChecked} ok />
        <MetricCard
          label="Расхождений по числу строк"
          value={metrics.rowCountMismatches}
          ok={metrics.rowCountMismatches === 0}
        />
        <MetricCard
          label="Восстановлено FK-ограничений"
          value={metrics.fkConstraintsRestored}
          detail="0 нарушений при восстановлении"
          ok
        />
        <MetricCard
          label="Разнообразие городов"
          value={`${metrics.diversityTransformed.distinct_city} / ${metrics.diversityOriginal.distinct_city}`}
          detail="уникальных значений, после / до трансформации"
          ok={
            metrics.diversityTransformed.distinct_city ===
            metrics.diversityOriginal.distinct_city
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Число строк по таблицам</CardTitle>
          <p className="text-sm text-muted-foreground">
            Схемы person / humanresources / sales — все таблицы, не только те,
            что содержат PII-колонки.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Таблица</TableHead>
                <TableHead>Исходно</TableHead>
                <TableHead>После</TableHead>
                <TableHead>Статус</TableHead>
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
                        {ok ? "OK" : "РАСХОЖДЕНИЕ"}
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
            {ok ? "OK" : "ПРОВЕРИТЬ"}
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
