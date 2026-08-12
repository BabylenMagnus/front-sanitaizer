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
      "Сканирование Adventure Works Presidio — классификация колонка за колонкой.",
  },
  {
    key: "generator",
    title: "generator",
    description:
      "Офлайн-пайплайн генерации LangGraph — предварительное заполнение mapping store в Redis.",
  },
  {
    key: "dump",
    title: "greenmask dump",
    description: "Потоковый дамп `original` с анонимизацией на лету.",
  },
  {
    key: "restore",
    title: "greenmask restore",
    description: "Восстановление в базу `transformed`, созданную с нуля.",
  },
]

export default function LogsPage() {
  return (
    <section className="container flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Логи пайплайна
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Необработанный stdout/stderr последнего проверенного сквозного
          прогона, в порядке выполнения пайплайна.
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
              {data.logs[section.key] || "(пусто)"}
            </pre>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
