import { createLocalJWKSet, createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

/** Cabeçalho interno Worker → Durable Object. Qualquer valor enviado pelo cliente é sobrescrito. */
export const USER_HEADER = "x-psicose-user";

let cached: { source: string; keys: JWTVerifyGetKey } | undefined;

function keySet(env: Env): JWTVerifyGetKey {
  const source = env.AUTH_JWKS ?? env.SUPABASE_URL;
  if (cached?.source !== source) {
    cached = {
      source,
      keys: env.AUTH_JWKS
        ? createLocalJWKSet(JSON.parse(env.AUTH_JWKS))
        : createRemoteJWKSet(new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`)),
    };
  }
  return cached.keys;
}

/** Valida o JWT do Supabase Auth (chaves assimétricas) e devolve o id do usuário, ou null. */
export async function verifyUser(token: string | null, env: Env): Promise<string | null> {
  if (!token || !env.SUPABASE_URL) return null;
  try {
    const { payload } = await jwtVerify(token, keySet(env), {
      issuer: `${env.SUPABASE_URL}/auth/v1`,
      audience: "authenticated",
    });
    return typeof payload.sub === "string" && payload.sub !== "" ? payload.sub : null;
  } catch {
    return null;
  }
}

export function bearer(req: Request): string | null {
  const h = req.headers.get("authorization");
  return h?.startsWith("Bearer ") ? h.slice(7) : null;
}
