import { shuffle, type Rng } from "./random";

export const MAX_PLAYERS = 4;
export const MAX_MESSAGE_LENGTH = 500; // D-28

// shortcut: lista neutra do beta (D-27); substituir quando os Agentes 2/4 definirem os codinomes.
export const CODENAME_POOL = ["Âmbar", "Cinza", "Índigo", "Ocre", "Carmim", "Jade", "Ônix", "Sépia"] as const;

export type Role = "monstro" | "inocente";
export type Phase = "lobby" | "partida" | "encerrada";

/** Resultado da partida. Novas condições de vitória entram aqui como novos `reason`. */
export interface MatchResult {
  winner: "inocentes" | "monstro";
  reason: "monstro_abandonou"; // D-31
}

export interface Player {
  userId: string;
  codename: string;
  role: Role;
  /** D-29: saiu voluntariamente durante a partida; não volta. */
  abandoned: boolean;
}

/** Estado completo e autoritativo. Só existe no servidor; nunca é enviado ao cliente. */
export interface RoomState {
  code: string;
  phase: Phase;
  /** userIds na ordem de entrada. */
  seats: string[];
  /** Preenchido no início da partida, em ordem embaralhada. */
  players: Player[];
  nextMsgSeq: number;
  createdAt: number;
  startedAt: number | null;
  result: MatchResult | null;
}

/** Mensagem gravada. Guarda só codinomes, nunca ids de conta. `to` = null → chat público. */
export interface ChatMessage {
  seq: number;
  at: number;
  from: string;
  to: string | null;
  text: string;
}

export type RuleError =
  | "sala_cheia"
  | "partida_em_andamento"
  | "abandonou"
  | "jogadores_insuficientes"
  | "fora_da_partida"
  | "mensagem_invalida"
  | "destinatario_invalido";

export type Result<T> = { ok: true; value: T } | { ok: false; error: RuleError };
const ok = <T>(value: T): Result<T> => ({ ok: true, value });
const fail = <T>(error: RuleError): Result<T> => ({ ok: false, error });

/** A vaga de quem criou a sala já fica reservada. */
export function createRoom(code: string, creatorId: string, now: number): RoomState {
  return { code, phase: "lobby", seats: [creatorId], players: [], nextMsgSeq: 1, createdAt: now, startedAt: null, result: null };
}

/** Entrada ou reconexão. Quem já ocupa uma vaga volta para ela, exceto quem abandonou a partida (D-29). */
export function join(state: RoomState, userId: string): Result<{ state: RoomState; rejoined: boolean }> {
  if (playerOf(state, userId)?.abandoned) return fail("abandonou");
  if (state.seats.includes(userId)) return ok({ state, rejoined: true });
  if (state.phase !== "lobby") return fail("partida_em_andamento");
  if (state.seats.length >= MAX_PLAYERS) return fail("sala_cheia");
  return ok({ state: { ...state, seats: [...state.seats, userId] }, rejoined: false });
}

/**
 * D-29: no lobby libera a vaga; na partida é abandono definitivo.
 * D-31: se quem abandona é o Monstro, os Inocentes vencem na hora.
 * Queda de conexão nunca passa por aqui.
 */
export function leave(state: RoomState, userId: string): RoomState {
  if (state.phase === "lobby") {
    return state.seats.includes(userId) ? { ...state, seats: state.seats.filter((id) => id !== userId) } : state;
  }
  const me = playerOf(state, userId);
  if (state.phase !== "partida" || !me || me.abandoned) return state;
  const next: RoomState = { ...state, players: state.players.map((p) => (p === me ? { ...p, abandoned: true } : p)) };
  if (me.role === "monstro") return { ...next, phase: "encerrada", result: { winner: "inocentes", reason: "monstro_abandonou" } };
  return next;
}

/** D-25: começa sozinha quando a 4ª vaga é ocupada. Sorteio secreto de 1 Monstro + 3 Inocentes. */
export function startMatch(state: RoomState, rng: Rng, now: number): Result<RoomState> {
  if (state.phase !== "lobby") return fail("partida_em_andamento");
  if (state.seats.length !== MAX_PLAYERS) return fail("jogadores_insuficientes");

  const order = shuffle(state.seats, rng); // a ordem dos jogadores não revela a ordem de entrada
  const codenames = shuffle(CODENAME_POOL, rng).slice(0, MAX_PLAYERS);
  const monster = rng(MAX_PLAYERS);
  const players = order.map((uid, i): Player => ({
    userId: uid,
    codename: codenames[i]!,
    role: i === monster ? "monstro" : "inocente",
    abandoned: false,
  }));
  return ok({ ...state, phase: "partida", players, startedAt: now });
}

function validText(text: unknown): string | null {
  if (typeof text !== "string") return null;
  const t = text.trim();
  return t.length > 0 && t.length <= MAX_MESSAGE_LENGTH ? t : null;
}

export function playerOf(state: RoomState, userId: string): Player | undefined {
  return state.players.find((p) => p.userId === userId);
}

/** Chat público (D-28: só durante a partida). */
export function postPublic(state: RoomState, userId: string, text: unknown, now: number) {
  return post(state, userId, null, text, now);
}

/** Mensagem privada entre dois jogadores, endereçada por codinome. */
export function postPrivate(state: RoomState, userId: string, toCodename: unknown, text: unknown, now: number) {
  const me = playerOf(state, userId);
  if (state.phase !== "partida" || !me || me.abandoned) return fail<Posted>("fora_da_partida");
  const target = state.players.find((p) => p.codename === toCodename);
  if (!target || target.userId === userId || target.abandoned) return fail<Posted>("destinatario_invalido");
  return post(state, userId, target.codename, text, now);
}

type Posted = { state: RoomState; message: ChatMessage };

function post(state: RoomState, userId: string, to: string | null, text: unknown, now: number): Result<{ state: RoomState; message: ChatMessage }> {
  const me = playerOf(state, userId);
  if (state.phase !== "partida" || !me || me.abandoned) return fail("fora_da_partida");
  const t = validText(text);
  if (t === null) return fail("mensagem_invalida");
  const message: ChatMessage = { seq: state.nextMsgSeq, at: now, from: me.codename, to, text: t };
  return ok({ state: { ...state, nextMsgSeq: state.nextMsgSeq + 1 }, message });
}

/** O destinatário de uma mensagem: null = todos; senão, os userIds do remetente e do destinatário. */
export function audienceOf(state: RoomState, message: ChatMessage): string[] | null {
  if (message.to === null) return null;
  return state.players.filter((p) => p.codename === message.from || p.codename === message.to).map((p) => p.userId);
}

export function canSee(message: ChatMessage, viewerCodename: string | undefined): boolean {
  return message.to === null || (viewerCodename !== undefined && (message.from === viewerCodename || message.to === viewerCodename));
}

/** O que um jogador pode ver. Nunca contém ids de conta nem o papel dos outros. */
export interface Snapshot {
  code: string;
  phase: Phase;
  maxPlayers: number;
  /** Lobby: vagas ocupadas, sem identidade (D-26). */
  seats: { you: boolean; online: boolean }[];
  /** Partida: o próprio codinome e papel. */
  me: { codename: string; role: Role } | null;
  /** Partida: codinomes de todos, sem papéis. */
  players: { codename: string; online: boolean; you: boolean; abandoned: boolean }[];
  messages: ChatMessage[];
  /** Fase "encerrada": quem venceu e por quê. */
  result: MatchResult | null;
}

export function viewFor(state: RoomState, userId: string, messages: readonly ChatMessage[], online: ReadonlySet<string>): Snapshot {
  const me = playerOf(state, userId);
  return {
    code: state.code,
    phase: state.phase,
    maxPlayers: MAX_PLAYERS,
    seats: state.seats.map((id) => ({ you: id === userId, online: online.has(id) })),
    me: me ? { codename: me.codename, role: me.role } : null,
    players: state.players.map((p) => ({
      codename: p.codename,
      online: online.has(p.userId),
      you: p.userId === userId,
      abandoned: p.abandoned,
    })),
    messages: messages.filter((m) => canSee(m, me?.codename)),
    result: state.result ?? null,
  };
}
