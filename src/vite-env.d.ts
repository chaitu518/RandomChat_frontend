/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WS_BROKER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __APP_CONFIG__?: {
    VITE_WS_BROKER_URL?: string;
  };
}
