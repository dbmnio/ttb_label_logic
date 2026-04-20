'use client'

import { signIn, signOut, useSession } from "next-auth/react"
import { Button } from "./ui/button"

export function AuthButton() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div className="h-9 w-24 bg-slate-200 animate-pulse rounded-md" />
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground hidden sm:inline-block">
          {session.user?.email || session.user?.name}
        </span>
        <Button variant="outline" size="sm" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    )
  }
  
  return (
    <Button size="sm" onClick={() => signIn('cognito')}>
      Sign in
    </Button>
  )
}
