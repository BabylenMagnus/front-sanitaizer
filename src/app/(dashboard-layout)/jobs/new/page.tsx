"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import type { JobSource } from "@/lib/jobs-api"

import { useSession } from "@/lib/auth-client"
import {
  listSources,
  registerDsnSource,
  startJob,
  uploadDumpSource,
} from "@/lib/jobs-api"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type IntakeTab = "list" | "dsn" | "file"

export default function NewJobPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const isAdmin = (session?.user as { role?: string })?.role === "admin"

  const [tab, setTab] = useState<IntakeTab>("list")
  const [sources, setSources] = useState<JobSource[]>([])
  const [sourceId, setSourceId] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshSources = () =>
    listSources()
      .then((list) => {
        setSources(list)
        setSourceId((prev) => prev ?? list[0]?.id ?? null)
      })
      .catch((e) => setError(String(e)))

  useEffect(() => {
    refreshSources()
  }, [])

  const selectedSource = sources.find((s) => s.id === sourceId)

  async function handleStart() {
    if (!sourceId) return
    setStarting(true)
    setError(null)
    try {
      const { job_id } = await startJob(sourceId)
      router.push(`/jobs/${job_id}`)
    } catch (e) {
      setError(String(e))
      setStarting(false)
    }
  }

  return (
    <section className="container flex max-w-2xl flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Новая задача санитизации
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Источник → подтверждение → запуск. Профиль санитизации детектируется
          пайплайном заново на каждом прогоне — пользователю выбирать нечего,
          именно этим и обеспечивается безопасность для 200 человек.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-1 rounded-md border p-1">
        <TabButton active={tab === "list"} onClick={() => setTab("list")}>
          Из списка
        </TabButton>
        <TabButton
          active={tab === "dsn"}
          onClick={() => setTab("dsn")}
          disabled={!isAdmin}
        >
          По строке подключения {!isAdmin && "(админ)"}
        </TabButton>
        <TabButton active={tab === "file"} onClick={() => setTab("file")}>
          Файл дампа (.sql)
        </TabButton>
      </div>

      {tab === "list" && (
        <SourceListStep
          sources={sources}
          sourceId={sourceId}
          onSelect={setSourceId}
        />
      )}
      {tab === "dsn" && (
        <DsnStep
          onRegistered={(id) => {
            refreshSources().then(() => setSourceId(id))
            setTab("list")
          }}
        />
      )}
      {tab === "file" && (
        <UploadStep
          onUploaded={(id) => {
            refreshSources().then(() => setSourceId(id))
            setTab("list")
          }}
        />
      )}

      {selectedSource && tab === "list" && (
        <Card>
          <CardHeader>
            <CardTitle>Подтверждение</CardTitle>
            <CardDescription>
              Прод-данные — перед запуском покажем, что именно произойдёт.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Row label="Источник" value={selectedSource.label} />
            <Row label="Тип" value={selectedSource.kind} />
            <Row
              label="Куда"
              value="отдельная `_sanitized`/`transformed` база рядом с исходной"
            />
          </CardContent>
          <CardFooter>
            {!confirming ? (
              <Button onClick={() => setConfirming(true)}>
                Проверить и запустить
              </Button>
            ) : (
              <div className="flex w-full items-center justify-between gap-3 rounded-md border border-primary/40 bg-primary/5 p-3">
                <span className="text-sm">
                  Точно запустить санитизацию «{selectedSource.label}»?
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirming(false)}
                  >
                    Отмена
                  </Button>
                  <Button size="sm" disabled={starting} onClick={handleStart}>
                    {starting ? "Запускаю…" : "Запустить"}
                  </Button>
                </div>
              </div>
            )}
          </CardFooter>
        </Card>
      )}
    </section>
  )
}

function TabButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent"
      } ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
    >
      {children}
    </button>
  )
}

function SourceListStep({
  sources,
  sourceId,
  onSelect,
}: {
  sources: JobSource[]
  sourceId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Шаг 1 — источник</CardTitle>
        <CardDescription>
          Базы, зарегистрированные платформенной командой или загруженные через
          вкладки выше, которые доступны твоей роли.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {sources.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`flex items-center justify-between rounded-md border p-3 text-left text-sm transition-colors ${
              sourceId === s.id
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
          >
            <span>
              {s.label}{" "}
              <span className="text-xs text-muted-foreground">({s.kind})</span>
            </span>
            {sourceId === s.id && <Badge>выбрано</Badge>}
          </button>
        ))}
        {sources.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Пока нет доступных источников.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function DsnStep({ onRegistered }: { onRegistered: (id: string) => void }) {
  const [mode, setMode] = useState<"form" | "url">("form")
  const [label, setLabel] = useState("")

  // form mode
  const [host, setHost] = useState("")
  const [port, setPort] = useState("5432")
  const [dbuser, setDbuser] = useState("postgres")
  const [password, setPassword] = useState("")
  const [dbname, setDbname] = useState("")

  // url mode
  const [url, setUrl] = useState("")

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    let submitHost = host
    let submitPort = port
    let submitUser = dbuser
    let submitPass = password
    let submitDb = dbname

    if (mode === "url") {
      try {
        const parsed = new URL(url)
        if (!parsed.protocol.startsWith("postgres"))
          throw new Error("Неверный протокол, ожидается postgres://")
        submitHost = parsed.hostname
        submitPort = parsed.port || "5432"
        submitUser = parsed.username || "postgres"
        submitPass = parsed.password || ""
        submitDb = parsed.pathname.replace("/", "") || "postgres"
      } catch (_err) {
        setError(
          "Неверный формат URL подключения (ожидается postgres://user:pass@host:port/db)"
        )
        setBusy(false)
        return
      }
    }

    try {
      const { source_id } = await registerDsnSource({
        label,
        host: submitHost,
        port: submitPort,
        dbuser: submitUser,
        password: submitPass,
        dbname: submitDb,
      })
      onRegistered(source_id)
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Зарегистрировать источник по DSN</CardTitle>
        <CardDescription>
          Только для admin — это ровно тот доступ, который платформенная команда
          выдаёт осторожно, не то, что вводят 200 человек в форму. Хост должен
          быть доступен из Docker-сети пайплайна (не <code>localhost</code> —
          если Postgres на этой же машине, укажи{" "}
          <code>host.docker.internal</code>).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Не удалось подключиться</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-1 rounded-md border p-1 w-full max-w-xs mb-2">
            <TabButton active={mode === "form"} onClick={() => setMode("form")}>
              Форма
            </TabButton>
            <TabButton active={mode === "url"} onClick={() => setMode("url")}>
              URL
            </TabButton>
          </div>

          <Field label="Название" value={label} onChange={setLabel} />

          {mode === "form" ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Хост" value={host} onChange={setHost} />
              <Field label="Порт" value={port} onChange={setPort} />
              <Field label="Пользователь" value={dbuser} onChange={setDbuser} />
              <Field
                label="Пароль"
                value={password}
                onChange={setPassword}
                type="password"
              />
              <Field label="Имя БД" value={dbname} onChange={setDbname} />
            </div>
          ) : (
            <Field
              label="URL подключения (postgres://...)"
              value={url}
              onChange={setUrl}
            />
          )}

          <Button type="submit" disabled={busy} className="mt-2 w-full">
            {busy ? "Проверяю подключение…" : "Зарегистрировать источник"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function UploadStep({ onUploaded }: { onUploaded: (id: string) => void }) {
  const [label, setLabel] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const { source_id } = await uploadDumpSource(label || file.name, file)
      onUploaded(source_id)
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Загрузить дамп</CardTitle>
        <CardDescription>
          Только plain-SQL дамп (<code>pg_dump --format=plain</code>), до 500 МБ
          — грузится в отдельную базу в том же Postgres, что и остальной
          пайплайн. Бинарный custom-format (.dump) пока не поддержан.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-3">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Не удалось загрузить</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Field label="Название" value={label} onChange={setLabel} full />
          <div className="flex flex-col gap-1.5">
            <Label>Файл (.sql)</Label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${dragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:bg-accent/50"} ${file ? "bg-accent/50" : ""}`}
            >
              <input
                id="file"
                type="file"
                accept=".sql"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="absolute inset-0 z-50 h-full w-full cursor-pointer opacity-0"
                required={!file}
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
                {file ? (
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium">
                      Перетащите файл сюда или нажмите для выбора
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Только .sql файлы до 500 МБ
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button type="submit" disabled={busy || !file}>
            {busy ? "Загружаю и разворачиваю…" : "Загрузить"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  full,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  full?: boolean
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? "col-span-2" : ""}`}>
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
