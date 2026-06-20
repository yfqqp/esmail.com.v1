// src/app/[locale]/login/page.tsx
import LoginClient from './LoginClient'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  return <LoginClient />
}
