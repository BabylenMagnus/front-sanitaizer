"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { signOut, useSession } from "@/lib/auth-client"

import { Button } from "@/components/ui/button"

export default function JobsAuthGate({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && !session) router.push("/login")
  }, [isPending, session, router])

  if (isPending) {
    return <p className="p-4 text-sm text-muted-foreground">Проверяю сессию…</p>
  }
  if (!session) return null

  return (
    <div>
      <div className="flex items-center justify-end gap-2 border-b p-2 text-sm text-muted-foreground">
        {session.user.email} (
        {(session.user as { role?: string }).role || "user"})
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut().then(() => router.push("/login"))}
        >
          Выйти
        </Button>
      </div>
      {children}
    </div>
  )
}
