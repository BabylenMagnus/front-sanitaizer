import type { PipelineRunData } from "@/types/pipeline"

import pipelineRun from "@/data/pipeline-run.json"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const data = pipelineRun as PipelineRunData

const SECTIONS: {
  key: keyof PipelineRunData["logs"]
  title: string
  description: string
}[] = [
  {
    key: "detector",
    title: "detector",
    description:
      "Presidio scan of Adventure Works — column-by-column classification.",
  },
  {
    key: "generator",
    title: "generator",
    description:
      "LangGraph offline generation pipeline — pre-populating the Redis mapping store.",
  },
  {
    key: "dump",
    title: "greenmask dump",
    description:
      "Streaming dump of `original` with anonymization applied on the fly.",
  },
  {
    key: "restore",
    title: "greenmask restore",
    description: "Restore into a from-scratch `transformed` database.",
  },
]

export default function LogsPage() {
  return (
    <section className="container flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Raw stdout/stderr from the last verified end-to-end run, in pipeline
          order.
        </p>
      </div>

      {SECTIONS.map((section) => (
        <Card key={section.key}>
          <CardHeader>
            <CardTitle className="font-mono text-base">
              {section.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {section.description}
            </p>
          </CardHeader>
          <CardContent>
            <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">
              {data.logs[section.key] || "(empty)"}
            </pre>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
