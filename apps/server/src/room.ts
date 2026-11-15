import {
  audienceOf, CloseCode, createRoom, join, leave, MAX_PLAYERS, parseClientMessage, postPrivate, postPublic, secureRandomInt,
  startMatch, viewFor, type ChatMessage, type RoomState, type ServerError, type ServerMessage,
} from "@psicose/rules";
import { Server, type Connection, type ConnectionContext, type WSMessage } from "partyserver";
import { USER_HEADER } from "./auth";

type ConnState = { userId: string };
type Conn = Connection<ConnState>;

const STATE_KEY = "state";
const msgKey = (seq: number) => `msg:${String(seq).padStart(8, "0")}`;

const REJECT_CODE: Partial<Record<ServerError, number>> = {
  sala_inexistente: CloseCode.sala_inexistente,
  sala_cheia: CloseCode.sala_cheia,
  partida_em_andamento: CloseCode.partida_em_andamento,
  abandonou: CloseCode.abandonou,
};

/**
 * Uma sala = um Durable Object. O estado autoritativo fica no armazenamento SQLite do DO;
 * os campos em memória são só cache, recarregados em onStart (após hibernação, deploy ou queda).
 */
export class Room extends Server<Env> {
  static options = { hibernate: true };

  private room: RoomState | null = null;
  private messages: ChatMessage[] = [];

  async onStart() {
    this.room = (await this.ctx.storage.get<RoomState>(STATE_KEY)) ?? null;
    this.messages = [...(await this.ctx.storage.list<ChatMessage>({ prefix: "msg:" })).values()];
  }

  /** RPC do Worker. Falso se o código já estiver em uso. */
  async initRoom(code: string, creatorId: string): Promise<boolean> {
    if (this.room) return false;
    await this.save(createRoom(code, creatorId, Date.now()));
    return true;
  }

  getConnectionTags(_conn: Connection, ctx: ConnectionContext): string[] {
    return [ctx.request.headers.get(USER_HEADER) ?? "anonimo"];
  }

  async onConnect(conn: Conn, ctx: ConnectionContext) {
    const userId = ctx.request.headers.get(USER_HEADER);
    if (!userId) return conn.close(CloseCode.nao_autenticado, "nao_autenticado");
    if (!this.room) return this.reject(conn, "sala_inexistente");

    const r = join(this.room, userId);
    if (!r.ok) return this.reject(conn, r.error);

    conn.setState({ userId });
    // Reconexão: a conexão nova substitui a antiga do mesmo usuário.
    for (const old of this.getConnections<ConnState>(userId)) {
      if (old.id !== conn.id) old.close(CloseCode.substituida, "substituida");
    }
    if (!r.value.rejoined) {
      let next = r.value.state;
      if (next.seats.length === MAX_PLAYERS) {
        const started = startMatch(next, secureRandomInt, Date.now()); // D-25: início automático com 4
        if (started.ok) next = started.value;
      }
      await this.save(next);
    }
    this.pushSnapshots(); // inclui o snapshot completo para quem reconectou
  }

  async onMessage(conn: Conn, raw: WSMessage) {
    const userId = conn.state?.userId;
    if (!userId || !this.room) return;
    const m = parseClientMessage(raw);
    if (!m) return send(conn, { t: "error", error: "mensagem_malformada" });
    const now = Date.now();

    switch (m.t) {
      case "leave": {
        // D-29: no lobby libera a vaga; na partida é abandono definitivo.
        const next = leave(this.room, userId);
        if (next !== this.room) await this.save(next);
        conn.close(CloseCode.saiu, "saiu");
        return this.pushSnapshots(conn.id);
      }
      case "chat":
      case "pm": {
        const r = m.t === "chat" ? postPublic(this.room, userId, m.text, now) : postPrivate(this.room, userId, m.to, m.text, now);
        if (!r.ok) return send(conn, { t: "error", error: r.error });
        const { state, message } = r.value;
        // Estado e mensagem gravados juntos (atômico) antes de qualquer envio.
        await this.ctx.storage.put({ [STATE_KEY]: state, [msgKey(message.seq)]: message });
        this.room = state;
        this.messages.push(message);
        const audience = audienceOf(state, message);
        for (const c of this.getConnections<ConnState>()) {
          if (c.state && (!audience || audience.includes(c.state.userId))) send(c, { t: "msg", message });
        }
        return;
      }
    }
  }

  onClose(conn: Conn) {
    this.pushSnapshots(conn.id);
  }

  private async save(state: RoomState) {
    await this.ctx.storage.put(STATE_KEY, state);
    this.room = state;
  }

  private reject(conn: Conn, error: ServerError) {
    send(conn, { t: "error", error });
    conn.close(REJECT_CODE[error] ?? CloseCode.sala_inexistente, error);
  }

  /** Envia a cada conexão a visão filtrada dela. */
  // shortcut: reenvia todas as mensagens visíveis a cada mudança; trocar por envio incremental se as partidas ficarem longas.
  private pushSnapshots(excludeId?: string) {
    if (!this.room) return;
    const live = [...this.getConnections<ConnState>()].filter((c) => c.id !== excludeId && c.state);
    const online = new Set(live.map((c) => c.state!.userId));
    for (const c of live) send(c, { t: "snapshot", snapshot: viewFor(this.room, c.state!.userId, this.messages, online) });
  }
}

function send(conn: Connection, msg: ServerMessage) {
  conn.send(JSON.stringify(msg));
}
