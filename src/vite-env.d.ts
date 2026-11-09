/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** Optional. Which file in public/tenants to load. Defaults to "cnr". */
  readonly VITE_TENANT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
