import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { admin } from "better-auth/plugins"

import { db } from "./db"

// Same pattern as Tanuki (tanuki_front/lib/auth.ts), trimmed to what this
// project actually needs: email+password only (no OAuth, no email sending —
// this isn't a public product, it's an internal tool for ~200 people whose
// accounts the platform team provisions), plus the admin() plugin for
// role-based access to sources ("who can sanitize which DB").
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  secret: process.env.BETTER_AUTH_SECRET || "dev-only-change-me",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3099",
  trustedOrigins: [
    "http://localhost:3099",
    "http://localhost:3000",
    "https://www.sanitaizer.cheesy-pizza.ru",
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [admin(), nextCookies()],
})

export type Session = typeof auth.$Infer.Session
