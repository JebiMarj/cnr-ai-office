/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CRM_FORM_WEBHOOK_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
