declare namespace Cloudflare {
  interface Env {
    Room: DurableObjectNamespace<import("./room").Room>;
    ENVIRONMENT: string;
    /** URL do projeto Supabase do PSICOSE (nunca de outro projeto, D-22). */
    SUPABASE_URL: string;
    /** Opcional: JWKS estático (JSON). Usado nos testes; em produção as chaves vêm do Supabase. */
    AUTH_JWKS?: string;
    /** Só nos testes. */
    TEST_PRIVATE_JWK?: string;
  }
}
interface Env extends Cloudflare.Env {}
