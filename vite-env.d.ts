/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CODEGEN_API_TOKEN: string
  readonly VITE_CODEGEN_ORG_ID: string
  readonly VITE_GITHUB_TOKEN: string
  readonly GEMINI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
