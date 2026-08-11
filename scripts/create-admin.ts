// Provisions a user account directly via better-auth's admin API, bypassing
// the public sign-up endpoint (disabled — see src/lib/auth.ts,
// emailAndPassword.disableSignUp). This is how the platform team is meant
// to create accounts for the ~200 users: no public registration.
//
// Usage (on the server, same env as the running app):
//   cd /root/sanitaizer-web && bun run scripts/create-admin.ts <email> <password> [role]
//   role defaults to "user" — pass "admin" explicitly for an admin account.
import { auth } from "../src/lib/auth"

async function main() {
  const [, , email, password, role] = process.argv
  if (!email || !password) {
    console.error(
      "Usage: bun run scripts/create-admin.ts <email> <password> [admin|user]"
    )
    process.exit(1)
  }

  const result = await auth.api.createUser({
    body: {
      email,
      password,
      name: email,
      role: role === "admin" ? "admin" : "user",
    },
  })

  console.log(`Created ${role === "admin" ? "admin" : "user"}: ${result.user.email} (id: ${result.user.id})`)
}

main().catch((err) => {
  console.error("Failed to create user:", err)
  process.exit(1)
})
