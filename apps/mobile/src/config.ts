/** Prévia visual com dados simulados (Expo Go, sem Supabase nem servidor). Nunca ativar em build de staging/produção. */
export const PREVIEW = process.env.EXPO_PUBLIC_PREVIEW === "1";

// Valores públicos (embutidos no app). Definir em apps/mobile/.env — ver .env.example.
const env = {
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  EXPO_PUBLIC_SERVER_URL: process.env.EXPO_PUBLIC_SERVER_URL ?? "",
};

export const missingConfig = Object.entries(env)
  .filter(([, v]) => !v)
  .map(([k]) => k);

const server = env.EXPO_PUBLIC_SERVER_URL ? new URL(env.EXPO_PUBLIC_SERVER_URL) : null;

export const config = {
  supabaseUrl: env.EXPO_PUBLIC_SUPABASE_URL || "http://localhost",
  supabaseKey: env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "ausente",
  serverUrl: env.EXPO_PUBLIC_SERVER_URL.replace(/\/$/, ""),
  serverHost: server?.host ?? "",
  serverSecure: server?.protocol === "https:",
};
