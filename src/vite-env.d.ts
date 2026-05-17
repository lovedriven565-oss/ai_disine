/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TG_BOT_USERNAME?: string;
  readonly VITE_TG_APP_SHORT_NAME?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_USE_BACKEND?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
