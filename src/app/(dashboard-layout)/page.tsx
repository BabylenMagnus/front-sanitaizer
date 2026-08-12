import Link from "next/link"

import type { PipelineRunData } from "@/types/pipeline"

import pipelineRun from "@/data/pipeline-run.json"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const data = pipelineRun as PipelineRunData

export default function HomePage() {
  const { meta, report, metrics } = data
  const autoApplied = report.filter((f) => f.auto_applied).length
  const reviewOnly = report.length - autoApplied

  const stats = [
    {
      label: "Найдено PII-колонок",
      value: report.length,
      detail: `${autoApplied} применено автоматически / ${reviewOnly} только на проверку`,
      href: "/report",
    },
    {
      label: "Проверено таблиц",
      value: metrics.tablesChecked,
      detail: `${metrics.rowCountMismatches} расхождений по числу строк`,
      href: "/metrics",
    },
    {
      label: "Восстановлено FK-ограничений",
      value: metrics.fkConstraintsRestored,
      detail: "чистое восстановление, нарушений нет",
      href: "/metrics",
    },
    {
      label: "Сохранено разнообразие городов",
      value: `${metrics.diversityTransformed.distinct_city} / ${metrics.diversityOriginal.distinct_city}`,
      detail: "уникальных значений, после / до трансформации",
      href: "/samples",
    },
  ]

  return (
    <section className="container flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Отчёт пайплайна db-sanitization
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {meta.dataset} — Greenmask + Presidio + LangGraph. Статичный снимок
          последнего проверенного прогона, сформирован {meta.generatedAt}.
          Источник:{" "}
          <a
            className="underline underline-offset-2"
            href={meta.sourceRepo}
            target="_blank"
            rel="noreferrer"
          >
            {meta.sourceRepo}
          </a>
          .
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-3xl">{stat.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{stat.detail}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Что показывает этот сайт</CardTitle>
          <CardDescription>
            Это отчёт, а не живой дашборд — он не подключён к Docker-контейнерам
            пайплайна. Всё ниже зафиксировано на этапе сборки по одному
            проверенному сквозному прогону.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <Row href="/report" title="Отчёт по PII">
            Находки Presidio по каждой колонке — тип сущности, определённый
            язык, применено автоматически или требует проверки.
          </Row>
          <Row href="/samples" title="До / После">
            Реальные строки из исходной и очищенной базы данных, бок о бок.
          </Row>
          <Row href="/metrics" title="Метрики верификации">
            Совпадение числа строк, целостность ссылок и проверки разнообразия
            по всем 37 таблицам.
          </Row>
          <Row href="/logs" title="Логи пайплайна">
            Необработанный вывод последнего прогона detector / generator /
            greenmask dump+restore.
          </Row>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">Greenmask</Badge>
        <Badge variant="outline">Presidio</Badge>
        <Badge variant="outline">LangGraph</Badge>
        <Badge variant="outline">Redis</Badge>
        <Badge variant="outline">PostgreSQL</Badge>
      </div>
    </section>
  )
}

function Row({
  href,
  title,
  children,
}: {
  href: string
  title: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-0.5 rounded-md border p-3 transition-colors hover:bg-muted/50"
    >
      <span className="font-medium">{title}</span>
      <span className="text-muted-foreground">{children}</span>
    </Link>
  )
}
