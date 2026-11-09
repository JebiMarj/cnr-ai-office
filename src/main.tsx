import { createRoot } from 'react-dom/client'
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'
import './styles.css'
import { App } from './App.tsx'
import type { Tenant } from './types.ts'

async function boot() {
  const qp = new URLSearchParams(window.location.search).get('tenant')
  const id = (qp && /^[a-z0-9-]+$/.test(qp) ? qp : null) ?? (import.meta.env.VITE_TENANT as string | undefined) ?? 'cnr'
  const res = await fetch(`/tenants/${id}.json`)
  const tenant = (await res.json()) as Tenant
  const r = document.documentElement.style
  r.setProperty('--primary', tenant.brand.primary)
  r.setProperty('--accent', tenant.brand.accent)
  r.setProperty('--gold', tenant.brand.gold)
  r.setProperty('--sidebar', tenant.brand.sidebar)
  document.title = `${tenant.workspace.name} · ${tenant.platform.name}`
  createRoot(document.getElementById('root')!).render(<App tenant={tenant} />)
}
void boot()
