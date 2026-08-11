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
      label: "PII columns found",
      value: report.length,
      detail: `${autoApplied} auto-applied / ${reviewOnly} review-only`,
      href: "/report",
    },
    {
      label: "Tables verified",
      value: metrics.tablesChecked,
      detail: `${metrics.rowCountMismatches} row-count mismatches`,
      href: "/metrics",
    },
    {
      label: "FK constraints restored",
      value: metrics.fkConstraintsRestored,
      detail: "clean restore, no violations",
      href: "/metrics",
    },
    {
      label: "City diversity preserved",
      value: `${metrics.diversityTransformed.distinct_city} / ${metrics.diversityOriginal.distinct_city}`,
      detail: "distinct values, transformed / original",
      href: "/samples",
    },
  ]

  return (
    <section className="container flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          db-sanitization pipeline report
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {meta.dataset} — Greenmask + Presidio + LangGraph. Static snapshot of
          the last verified run, generated {meta.generatedAt}. Source:{" "}
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
          <CardTitle>What this site shows</CardTitle>
          <CardDescription>
            This is a report, not a live dashboard — it doesn&apos;t connect
            back to the pipeline&apos;s Docker containers. Everything below was
            baked in at build time from one verified end-to-end run.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <Row href="/report" title="PII Detection Report">
            Presidio findings per column — entity type, detected language,
            auto-applied vs review-only.
          </Row>
          <Row href="/samples" title="Before / After">
            Real sample rows from the original vs sanitized database, side by
            side.
          </Row>
          <Row href="/metrics" title="Verification Metrics">
            Row-count parity, referential integrity, and diversity checks across
            all 37 tables.
          </Row>
          <Row href="/logs" title="Pipeline Logs">
            Raw output from the last detector / generator / greenmask
            dump+restore run.
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
