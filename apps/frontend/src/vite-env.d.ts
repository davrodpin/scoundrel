/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_NODE_ENV: string
  readonly VITE_BACKEND_URL: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
