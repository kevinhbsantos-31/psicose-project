import { generateRoomCode, isRoomCode, secureRandomInt } from "@psicose/rules";
import { getServerByName, routePartykitRequest } from "partyserver";
import { bearer, USER_HEADER, verifyUser } from "./auth";

export { Room } from "./room";

const json = (body: unknown, status = 200) => Response.json(body, { status });

async function createRoom(req: Request, env: Env): Promise<Response> {
  const userId = await verifyUser(bearer(req), env);
  if (!userId) return json({ error: "nao_autenticado" }, 401);
  // shortcut: sem limite de criação por usuário; adicionar rate limit antes do lançamento público.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode(secureRandomInt);
    const room = await getServerByName(env.Room, code);
    if (await room.initRoom(code, userId)) return json({ code }, 201);
  }
  return json({ error: "indisponivel" }, 503);
}

export default {
  async fetch(req, env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/health") return json({ ok: true, env: env.ENVIRONMENT });
    if (url.pathname === "/rooms" && req.method === "POST") return createRoom(req, env);

    const routed = await routePartykitRequest(req, env, {
      // WebSocket: /parties/room/<CÓDIGO>?token=<JWT>
      onBeforeConnect: async (r, lobby) => {
        if (!isRoomCode(lobby.name)) return json({ error: "sala_inexistente" }, 404);
        const userId = await verifyUser(new URL(r.url).searchParams.get("token"), env);
        if (!userId) return json({ error: "nao_autenticado" }, 401);
        const headers = new Headers(r.headers);
        headers.set(USER_HEADER, userId); // sobrescreve qualquer valor forjado pelo cliente
        return new Request(r, { headers });
      },
      // A sala só aceita WebSocket.
      onBeforeRequest: () => json({ error: "nao_encontrado" }, 404),
    });
    return routed ?? json({ error: "nao_encontrado" }, 404);
  },
} satisfies ExportedHandler<Env>;
