import { CloseCode, type ClientMessage, type ServerMessage, type Snapshot } from "@psicose/rules";
import { env, evictDurableObject, SELF } from "cloudflare:test";
import { generateKeyPair, importJWK, SignJWT } from "jose";
import { describe, expect, it } from "vitest";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function token(sub: string, key?: CryptoKey | Uint8Array): Promise<string> {
  const signingKey = key ?? (await importJWK(JSON.parse(env.TEST_PRIVATE_JWK!), "ES256"));
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: "teste" })
    .setSubject(sub)
    .setIssuer(`${env.SUPABASE_URL}/auth/v1`)
    .setAudience("authenticated")
    .setExpirationTime("1h")
    .sign(signingKey);
}

async function createRoom(sub: string): Promise<string> {
  const res = await SELF.fetch("https://x/rooms", { method: "POST", headers: { authorization: `Bearer ${await token(sub)}` } });
  expect(res.status).toBe(201);
  return ((await res.json()) as { code: string }).code;
}

class Client {
  inbox: ServerMessage[] = [];
  closeCode: number | null = null;
  constructor(readonly ws: WebSocket) {
    ws.accept();
    ws.addEventListener("message", (e) => {
      this.inbox.push(JSON.parse(e.data as string));
    });
    ws.addEventListener("close", (e) => {
      this.closeCode = e.code;
    });
  }
  send(m: ClientMessage) {
    this.ws.send(JSON.stringify(m));
  }
  /** Espera as mensagens assentarem e devolve o snapshot mais recente. */
  async snapshot(): Promise<Snapshot> {
    await sleep(150);
    const snaps = this.inbox.filter((m) => m.t === "snapshot");
    this.inbox = this.inbox.filter((m) => m.t !== "snapshot");
    const last = snaps.at(-1);
    if (!last) throw new Error("nenhum snapshot");
    return last.snapshot;
  }
  async take(t: ServerMessage["t"]): Promise<ServerMessage[]> {
    await sleep(150);
    const got = this.inbox.filter((m) => m.t === t);
    this.inbox = this.inbox.filter((m) => m.t !== t);
    return got;
  }
}

async function connect(code: string, sub: string, extraHeaders: Record<string, string> = {}): Promise<Client> {
  const res = await SELF.fetch(`https://x/parties/room/${code}?token=${await token(sub)}`, {
    headers: { upgrade: "websocket", ...extraHeaders },
  });
  if (!res.webSocket) throw new Error(`sem websocket: ${res.status}`);
  return new Client(res.webSocket);
}

async function fullMatch() {
  const ids = ["u-criador", "u-b", "u-c", "u-d"];
  const code = await createRoom(ids[0]!);
  const clients = [];
  for (const id of ids) clients.push(await connect(code, id));
  const snaps = await Promise.all(clients.map((c) => c.snapshot()));
  return { code, ids, clients, snaps };
}

describe("autenticação", () => {
  it("recusa criação de sala e conexão sem token válido", async () => {
    expect((await SELF.fetch("https://x/rooms", { method: "POST" })).status).toBe(401);
    const { privateKey } = await generateKeyPair("ES256");
    const forged = await token("intruso", privateKey);
    expect((await SELF.fetch("https://x/rooms", { method: "POST", headers: { authorization: `Bearer ${forged}` } })).status).toBe(401);
    const code = await createRoom("u-criador");
    expect((await SELF.fetch(`https://x/parties/room/${code}`, { headers: { upgrade: "websocket" } })).status).toBe(401);
    expect((await SELF.fetch(`https://x/parties/room/xx?token=${await token("a")}`, { headers: { upgrade: "websocket" } })).status).toBe(404);
  });

  it("ignora cabeçalho de usuário forjado pelo cliente", async () => {
    const code = await createRoom("u-criador");
    const intruso = await connect(code, "u-intruso", { "x-psicose-user": "u-criador" });
    // Se o cabeçalho fosse aceito, o intruso ocuparia a vaga reservada do criador.
    expect((await intruso.snapshot()).seats).toEqual([{ you: false, online: false }, { you: true, online: true }]);
  });

  it("recusa sala inexistente com código válido", async () => {
    const c = await connect("ZZZZZZ", "u-a");
    await sleep(150);
    expect(c.closeCode).toBe(CloseCode.sala_inexistente);
  });
});

describe("lobby e início", () => {
  it("começa sozinha com o 4º jogador, recusa o 5º e sorteia 1 Monstro secreto", async () => {
    const ids = ["u-criador", "u-b", "u-c", "u-d"];
    const code = await createRoom(ids[0]!);
    const clients = [];
    for (const id of ids.slice(0, 3)) clients.push(await connect(code, id));
    const lobby = await clients[1]!.snapshot();
    expect(lobby.phase).toBe("lobby");
    expect(lobby.seats).toHaveLength(3);

    clients.push(await connect(code, ids[3]!));
    const snaps = await Promise.all(clients.map((c) => c.snapshot()));

    const quinto = await connect(code, "u-e");
    await sleep(150);
    expect(quinto.closeCode).toBe(CloseCode.partida_em_andamento);

    expect(snaps.every((s) => s.phase === "partida" && s.me !== null)).toBe(true);
    expect(snaps.filter((s) => s.me!.role === "monstro")).toHaveLength(1);
    expect(new Set(snaps.map((s) => s.me!.codename)).size).toBe(4);
    for (const s of snaps) {
      const j = JSON.stringify(s);
      for (const id of ids) expect(j).not.toContain(id);
      expect(s.players.every((p) => !("role" in p))).toBe(true);
    }
  });
});

describe("chat", () => {
  it("público chega a todos; privado só às duas partes", async () => {
    const { clients, snaps } = await fullMatch();
    const [a, b, c, d] = clients;
    a!.send({ t: "chat", text: "olá a todos" });
    for (const cl of clients) expect((await cl.take("msg")).map((m) => m.t === "msg" && m.message.text)).toEqual(["olá a todos"]);

    a!.send({ t: "pm", to: snaps[1]!.me!.codename, text: "segredo" });
    expect(await a!.take("msg")).toHaveLength(1);
    expect(await b!.take("msg")).toHaveLength(1);
    expect(await c!.take("msg")).toHaveLength(0);
    expect(await d!.take("msg")).toHaveLength(0);

    a!.send({ t: "chat", text: "" });
    expect(await a!.take("error")).toEqual([{ t: "error", error: "mensagem_invalida" }]);
    // Limite de 500 validado no servidor (o app também limita, mas não é confiável).
    a!.send({ t: "chat", text: "x".repeat(501) });
    expect(await a!.take("error")).toEqual([{ t: "error", error: "mensagem_invalida" }]);
    a!.send({ t: "pm", to: snaps[1]!.me!.codename, text: "x".repeat(501) });
    expect(await a!.take("error")).toEqual([{ t: "error", error: "mensagem_invalida" }]);
    a!.send({ t: "chat", text: "x".repeat(500) });
    expect(await b!.take("msg")).toHaveLength(1);
  });
});

describe("persistência e reconexão", () => {
  it("recupera papel, codinome e mensagens após o Durable Object ser despejado da memória", async () => {
    const { code, ids, clients, snaps } = await fullMatch();
    clients[0]!.send({ t: "chat", text: "antes da queda" });
    clients[0]!.send({ t: "pm", to: snaps[2]!.me!.codename, text: "pv antes da queda" });
    await sleep(150);

    await evictDurableObject(env.Room.get(env.Room.idFromName(code)), { webSockets: "close" });

    const back = await connect(code, ids[2]!);
    const s = await back.snapshot();
    expect(s.phase).toBe("partida");
    expect(s.me).toEqual(snaps[2]!.me);
    expect(s.messages.map((m) => m.text)).toEqual(["antes da queda", "pv antes da queda"]);

    const other = await connect(code, ids[3]!);
    expect((await other.snapshot()).messages.map((m) => m.text)).toEqual(["antes da queda"]);
  });

  it("nova conexão do mesmo usuário substitui a anterior", async () => {
    const code = await createRoom("u-criador");
    const first = await connect(code, "u-criador");
    const second = await connect(code, "u-criador");
    await sleep(150);
    expect(first.closeCode).toBe(CloseCode.substituida);
    expect((await second.snapshot()).seats).toHaveLength(1);
  });

  it("sair durante a partida é abandono: os outros veem e quem saiu não volta", async () => {
    const { code, ids, clients, snaps } = await fullMatch();
    const q = snaps.findIndex((s) => s.me!.role === "inocente");
    const watcher = clients[(q + 1) % 4]!;
    clients[q]!.send({ t: "leave" });
    const view = await watcher.snapshot();
    expect(clients[q]!.closeCode).toBe(CloseCode.saiu);
    expect(view.phase).toBe("partida");
    expect(view.players.find((p) => p.codename === snaps[q]!.me!.codename)!.abandoned).toBe(true);

    const back = await connect(code, ids[q]!);
    await sleep(150);
    expect(back.closeCode).toBe(CloseCode.abandonou);
  });

  it("D-31: queda do Monstro não encerra; abandono do Monstro dá vitória aos Inocentes", async () => {
    const { code, ids, clients, snaps } = await fullMatch();
    const m = snaps.findIndex((s) => s.me!.role === "monstro");
    const watcher = clients[(m + 1) % 4]!;

    clients[m]!.ws.close(1000, "queda simulada"); // desconexão, não abandono
    const afterDrop = await watcher.snapshot();
    expect(afterDrop.phase).toBe("partida");
    expect(afterDrop.result).toBeNull();

    const monster = await connect(code, ids[m]!); // reconecta normalmente
    expect((await monster.snapshot()).me!.role).toBe("monstro");

    monster.send({ t: "leave" });
    const end = await watcher.snapshot();
    expect(end.phase).toBe("encerrada");
    expect(end.result).toEqual({ winner: "inocentes", reason: "monstro_abandonou" });
    watcher.send({ t: "chat", text: "depois do fim" });
    expect(await watcher.take("error")).toEqual([{ t: "error", error: "fora_da_partida" }]);
  });

  it("sair no lobby libera a vaga", async () => {
    const code = await createRoom("u-criador");
    const dono = await connect(code, "u-criador");
    const b = await connect(code, "u-b");
    b.send({ t: "leave" });
    expect((await dono.snapshot()).seats).toHaveLength(1);
    expect(b.closeCode).toBe(CloseCode.saiu);
  });
});
