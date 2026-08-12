import type { PipelineRunData } from "@/types/pipeline"

import pipelineRun from "@/data/pipeline-run.json"

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

export default function SamplesPage() {
  const { original, transformed } = data.samples

  return (
    <section className="container flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">До / После</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Реальные строки с одинаковыми первичными ключами из{" "}
          <code className="text-xs">original</code> и{" "}
          <code className="text-xs">transformed</code>. Одно и то же исходное
          значение всегда заменяется на один и тот же результат (см. повтор
          Bothell → Jimmyview ниже).
        </p>
      </div>

      <PairTable
        title="humanresources.employee — nationalidnumber"
        columns={["businessentityid", "nationalidnumber"]}
        original={original.employee}
        transformed={transformed.employee}
      />

      <PairTable
        title="person.person + person.emailaddress — идентичность между таблицами"
        description="Имя и производный e-mail остаются согласованными в двух разных таблицах, связанных по businessentityid."
        columns={["businessentityid", "firstname", "lastname", "emailaddress"]}
        original={original.identity}
        transformed={transformed.identity}
      />

      <PairTable
        title="sales.creditcard — cardnumber"
        columns={["creditcardid", "cardnumber"]}
        original={original.creditcard}
        transformed={transformed.creditcard}
      />

      <PairTable
        title="person.address — city"
        description="Один и тот же город в исходных данных везде (Bothell, WA — штаб-квартира Adventure Works) заменяется на один и тот же результат везде после трансформации."
        columns={["addressid", "city"]}
        original={original.address_city}
        transformed={transformed.address_city}
      />

      <PairTable
        title="sales.salesorderheader — accountnumber"
        columns={["salesorderid", "accountnumber"]}
        original={original.salesorderheader}
        transformed={transformed.salesorderheader}
      />
    </section>
  )
}

function PairTable({
  title,
  description,
  columns,
  original,
  transformed,
}: {
  title: string
  description?: string
  columns: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  original: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transformed: any[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono text-base">{title}</CardTitle>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
            Исходные данные
          </p>
          <SampleTable columns={columns} rows={original} />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
            После трансформации
          </p>
          <SampleTable columns={columns} rows={transformed} />
        </div>
      </CardContent>
    </Card>
  )
}

function SampleTable({
  columns,
  rows,
}: {
  columns: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: any[]
}) {
  return (
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
  )
}
