import { shuffle, type Rng } from "./random";

export const MAX_PLAYERS = 4;
export const MAX_MESSAGE_LENGTH = 500; // D-28
export const BULLETS = 2; // GDD §4

// shortcut: lista neutra do beta (D-27); substituir quando os Agentes 2/4 definirem os codinomes.
export const CODENAME_POOL = ["Âmbar", "Cinza", "Índigo", "Ocre", "Carmim", "Jade", "Ônix", "Sépia"] as const;

/** Os 10 Monstros (D-37, D-44). Regras em `docs/INFECCAO.md` §3. */
export const MONSTERS = [
  "concordante", "contestador", "silencioso", "socorro", "delator",
  "confidente", "eco", "reflexo", "anfitriao", "observador",
] as const;
export type MonsterId = (typeof MONSTERS)[number];
/** Monstros com regra de infecção já implementada. D-52: no beta o Monstro escolhe entre estes. */
export const IMPLEMENTED_MONSTERS: readonly MonsterId[] = ["silencioso", "eco", "anfitriao"];

export type Role = "monstro" | "inocente";
export type Phase = "lobby" | "partida" | "encerrada";

/** Resultado da partida (GDD §3, D-31, D-49, D-50). */
export interface MatchResult {
  winner: "inocentes" | "monstro";
  reason: "monstro_abandonou" | "monstro_morto" | "infeccao" | "ultimo_inocente";
  /** Revelado só no fim. */
  monster: { codename: string; type: MonsterId | null };
}

export interface Player {
  userId: string;
  codename: string;
  role: Role;
  /** D-29/D-50: saiu, deslogou ou ficou fora mais de 1 min; não volta. */
  abandoned: boolean;
  /** Falso depois de morrer (tiro) ou abandonar (D-50: abandono conta como morte). */
  alive: boolean;
  /** Infecção real: hora da confirmação; a vítima só vê em `notifyAt` (2 min depois). */
  infectedAt: number | null;
  notifyAt: number | null;
  /** D-50: desde quando está desconectado durante a partida. */
  awaySince: number | null;
}

/** GDD §4 e D-49. `holder` é codinome, nunca id de conta. */
export interface Gun {
  holder: string | null;
  bullets: number;
  /** Uma permissão foi dada para o próximo disparo. */
  armed: boolean;
}

/** Tentativa de infecção (INFECCAO.md §2.1). */
export interface Attempt {
  id: number;
  rule: MonsterId;
  target: string;
  baitSeq: number | null;
  /** Eco: palavra exata normalizada. */
  word: string | null;
  openedAt: number;
  endsAt: number | null;
  status: "ativa" | "sucesso" | "falha" | "anulada";
  /** Eco: ocorrências contadas. */
  count: number;
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
  /** D-52: escolhido pelo Monstro no início. */
  monsterType: MonsterId | null;
  gun: Gun;
  attempts: Attempt[];
  nextAttemptId: number;
  /** Recarga de 60 s depois de uma tentativa fracassada. */
  cooldownUntil: number;
  /** D-54: auto-infecção simulada do Monstro (não conta para vitória); hora em que aparece para ele. */
  fakeNotifyAt: number | null;
}

/** Mensagem gravada. Guarda só codinomes, nunca ids de conta. `to` = null → chat público. */
export interface ChatMessage {
  seq: number;
  at: number;
  from: string;
  to: string | null;
  text: string;
  /** Aviso do jogo (ex.: "Cinza pegou o revólver"). */
  system?: true;
}

export type RuleError =
  | "sala_cheia"
  | "partida_em_andamento"
  | "abandonou"
  | "jogadores_insuficientes"
  | "fora_da_partida"
  | "mensagem_invalida"
  | "destinatario_invalido"
  | "acao_invalida"
  | "disparo_negado"
  | "monstro_nao_escolhido"
  | "monstro_indisponivel"
  | "em_recarga"
  | "alvo_invalido"
  | "isca_invalida"
  | "limite_de_tentativas";

export type Result<T> = { ok: true; value: T } | { ok: false; error: RuleError };
export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const fail = <T>(error: RuleError): Result<T> => ({ ok: false, error });

/** A vaga de quem criou a sala já fica reservada. */
export function createRoom(code: string, creatorId: string, now: number): RoomState {
  return {
    code, phase: "lobby", seats: [creatorId], players: [], nextMsgSeq: 1, createdAt: now, startedAt: null, result: null,
    monsterType: null, gun: { holder: null, bullets: BULLETS, armed: false }, attempts: [], nextAttemptId: 1,
    cooldownUntil: 0, fakeNotifyAt: null,
  };
}

/** Entrada ou reconexão. Quem já ocupa uma vaga volta para ela, exceto quem abandonou a partida (D-29). */
export function join(state: RoomState, userId: string): Result<{ state: RoomState; rejoined: boolean }> {
  if (playerOf(state, userId)?.abandoned) return fail("abandonou");
  if (state.seats.includes(userId)) return ok({ state, rejoined: true });
  if (state.phase !== "lobby") return fail("partida_em_andamento");
  if (state.seats.length >= MAX_PLAYERS) return fail("sala_cheia");
  return ok({ state: { ...state, seats: [...state.seats, userId] }, rejoined: false });
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
    alive: true,
    infectedAt: null,
    notifyAt: null,
    awaySince: null,
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

/** Mensagem privada entre dois jogadores vivos, endereçada por codinome. */
export function postPrivate(state: RoomState, userId: string, toCodename: unknown, text: unknown, now: number) {
  const me = playerOf(state, userId);
  if (state.phase !== "partida" || !me || !me.alive) return fail<Posted>("fora_da_partida");
  const target = state.players.find((p) => p.codename === toCodename);
  if (!target || target.userId === userId || !target.alive) return fail<Posted>("destinatario_invalido");
  return post(state, userId, target.codename, text, now);
}

type Posted = { state: RoomState; message: ChatMessage };

function post(state: RoomState, userId: string, to: string | null, text: unknown, now: number): Result<Posted> {
  const me = playerOf(state, userId);
  if (state.phase !== "partida" || !me || !me.alive) return fail("fora_da_partida");
  const t = validText(text);
  if (t === null) return fail("mensagem_invalida");
  const message: ChatMessage = { seq: state.nextMsgSeq, at: now, from: me.codename, to, text: t };
  return ok({ state: { ...state, nextMsgSeq: state.nextMsgSeq + 1 }, message });
}

/** Aviso público do jogo no chat. */
export function systemMessage(state: RoomState, text: string, now: number): Posted {
  const message: ChatMessage = { seq: state.nextMsgSeq, at: now, from: "", to: null, text, system: true };
  return { state: { ...state, nextMsgSeq: state.nextMsgSeq + 1 }, message };
}

/** O destinatário de uma mensagem: null = todos; senão, os userIds do remetente e do destinatário. */
export function audienceOf(state: RoomState, message: ChatMessage): string[] | null {
  if (message.to === null) return null;
  return state.players.filter((p) => p.alive && (p.codename === message.from || p.codename === message.to)).map((p) => p.userId);
}

export function canSee(message: ChatMessage, viewerCodename: string | undefined): boolean {
  return message.to === null || (viewerCodename !== undefined && (message.from === viewerCodename || message.to === viewerCodename));
}

/** Só para o Monstro: as próprias tentativas e quem ele já infectou. */
export interface MonsterView {
  type: MonsterId | null;
  available: readonly MonsterId[];
  cooldownUntil: number;
  attempts: Attempt[];
  infected: string[];
  selfInfected: boolean;
}

/** O que um jogador pode ver. Nunca contém ids de conta nem o papel dos outros. */
export interface Snapshot {
  code: string;
  phase: Phase;
  maxPlayers: number;
  /** Lobby: vagas ocupadas, sem identidade (D-26). */
  seats: { you: boolean; online: boolean }[];
  /** Partida: o próprio codinome, papel e estado. `infected` só aparece 2 min depois da confirmação. */
  me: { codename: string; role: Role; alive: boolean; infected: boolean; monster: MonsterView | null } | null;
  /** Partida: codinomes de todos, sem papéis. */
  players: { codename: string; online: boolean; you: boolean; abandoned: boolean; alive: boolean }[];
  gun: Gun | null;
  messages: ChatMessage[];
  /** Fase "encerrada": quem venceu e por quê. */
  result: MatchResult | null;
}

export function viewFor(
  state: RoomState, userId: string, messages: readonly ChatMessage[], online: ReadonlySet<string>, now = Date.now(),
): Snapshot {
  const me = playerOf(state, userId);
  const isMonster = me?.role === "monstro";
  const seen = (at: number | null) => at !== null && now >= at;
  return {
    code: state.code,
    phase: state.phase,
    maxPlayers: MAX_PLAYERS,
    seats: state.seats.map((id) => ({ you: id === userId, online: online.has(id) })),
    me: me
      ? {
          codename: me.codename,
          role: me.role,
          alive: me.alive,
          infected: seen(me.notifyAt) || (isMonster && seen(state.fakeNotifyAt)),
          monster: isMonster
            ? {
                type: state.monsterType,
                available: IMPLEMENTED_MONSTERS,
                cooldownUntil: state.cooldownUntil,
                attempts: state.attempts,
                infected: state.players.filter((p) => p.infectedAt !== null).map((p) => p.codename),
                selfInfected: state.fakeNotifyAt !== null,
              }
            : null,
        }
      : null,
    players: state.players.map((p) => ({
      codename: p.codename,
      online: online.has(p.userId),
      you: p.userId === userId,
      abandoned: p.abandoned,
      alive: p.alive,
    })),
    gun: state.phase === "lobby" ? null : state.gun,
    // D-55: eliminados só veem o chat público.
    messages: messages.filter((m) => (me && !me.alive ? m.to === null : canSee(m, me?.codename))),
    result: state.result ?? null,
  };
}
