import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { exportJWK, generateKeyPair } from "jose";
import { defineConfig } from "vitest/config";

// Par de chaves gerado a cada execução: os testes assinam JWTs como o Supabase faria, sem rede.
const { publicKey, privateKey } = await generateKeyPair("ES256", { extractable: true });
const kid = "teste";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        bindings: {
          SUPABASE_URL: "https://teste.supabase.co",
          AUTH_JWKS: JSON.stringify({ keys: [{ ...(await exportJWK(publicKey)), kid, alg: "ES256" }] }),
          TEST_PRIVATE_JWK: JSON.stringify({ ...(await exportJWK(privateKey)), kid }),
        },
      },
    }),
  ],
});
