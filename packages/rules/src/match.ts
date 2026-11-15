import {
  canSee, fail, IMPLEMENTED_MONSTERS, ok, playerOf,
  type Attempt, type ChatMessage, type MonsterId, type Player, type Result, type RoomState,
} from "./room";

/** INFECCAO.md §1: vítima avisada 2 min depois; recarga de 60 s após falha. */
export const NOTIFY_DELAY_MS = 120_000;
export const COOLDOWN_MS = 60_000;
/** D-50: mais de 1 min fora do chat = abandono. */
export const ABANDON_AFTER_MS = 60_000;
/** INFECCAO.md §3.7. */
export const ECO_TARGET = 4;
export const ECO_SECOND_SLOT_MS = 120_000;

const WINDOW_MS: Partial<Record<MonsterId, number>> = { silencioso: 80_000, anfitriao: 25_000 };
const MAX_ACTIVE: Partial<Record<MonsterId, number>> = { eco: 2 };

const monsterOf = (s: RoomState) => s.players.find((p) => p.role === "monstro")!;
const byCodename = (s: RoomState, c: unknown) => s.players.find((p) => p.codename === c);

function patchPlayer(s: RoomState, codename: string, patch: Partial<Player>): RoomState {
  return { ...s, players: s.players.map((p) => (p.codename === codename ? { ...p, ...patch } : p)) };
}

function patchAttempt(s: RoomState, id: number, patch: Partial<Attempt>): RoomState {
  return { ...s, attempts: s.attempts.map((a) => (a.id === id ? { ...a, ...patch } : a)) };
}

const active = (s: RoomState, id: number) => s.attempts.find((a) => a.id === id && a.status === "ativa");

/** Anula sem recarga (alvo morreu, saiu ou caiu). */
function annul(s: RoomState, pred: (a: Attempt) => boolean): RoomState {
  return s.attempts.some((a) => a.status === "ativa" && pred(a))
    ? { ...s, attempts: s.attempts.map((a) => (a.status === "ativa" && pred(a) ? { ...a, status: "anulada" } : a)) }
    : s;
}

/** GDD §3 + D-31 + D-50. Abandono conta como morte. */
export function checkVictory(s: RoomState): RoomState {
  if (s.phase !== "partida") return s;
  const m = monsterOf(s);
  const end = (winner: "inocentes" | "monstro", reason: NonNullable<RoomState["result"]>["reason"]): RoomState => ({
    ...s, phase: "encerrada", result: { winner, reason, monster: { codename: m.codename, type: s.monsterType } },
  });
  if (m.abandoned) return end("inocentes", "monstro_abandonou");
  if (!m.alive) return end("inocentes", "monstro_morto");
  const alive = s.players.filter((p) => p.role === "inocente" && p.alive);
  if (alive.length <= 1) return end("monstro", "ultimo_inocente"); // condição 2 (e D-49: só Monstro e portador)
  if (alive.every((p) => p.infectedAt !== null)) return end("monstro", "infeccao"); // condições 1 e 3
  return s;
}

function eliminate(s: RoomState, codename: string, abandoned: boolean): RoomState {
  let next = patchPlayer(s, codename, abandoned ? { alive: false, abandoned: true } : { alive: false });
  next = annul(next, (a) => a.target === codename);
  // Quem sai do jogo não leva a arma: ela fica no chão.
  if (next.gun.holder === codename) next = { ...next, gun: { ...next.gun, holder: null, armed: false } };
  return checkVictory(next);
}

/** D-29: no lobby libera a vaga; na partida é abandono definitivo (D-50: conta como morte). */
export function leave(state: RoomState, userId: string): RoomState {
  if (state.phase === "lobby") {
    return state.seats.includes(userId) ? { ...state, seats: state.seats.filter((id) => id !== userId) } : state;
  }
  const me = playerOf(state, userId);
  if (state.phase !== "partida" || !me || me.abandoned) return state;
  return eliminate(state, me.codename, true);
}

/** Desconexão durante a partida. Q-01: a vítima do Silencioso precisa estar conectada → anula sem recarga. */
export function markAway(s: RoomState, userId: string, now: number): RoomState {
  const me = playerOf(s, userId);
  if (s.phase !== "partida" || !me || !me.alive || me.awaySince !== null) return s;
  return annul(patchPlayer(s, me.codename, { awaySince: now }), (a) => a.rule === "silencioso" && a.target === me.codename);
}

export function markBack(s: RoomState, userId: string): RoomState {
  const me = playerOf(s, userId);
  return me && me.awaySince !== null ? patchPlayer(s, me.codename, { awaySince: null }) : s;
}

function succeed(s: RoomState, id: number, now: number): RoomState {
  const a = active(s, id);
  if (!a) return s;
  const v = byCodename(s, a.target);
  if (!v || !v.alive || v.infectedAt !== null) return patchAttempt(s, id, { status: "anulada" });
  let next = patchAttempt(s, id, { status: "sucesso" });
  next = patchPlayer(next, v.codename, { infectedAt: now, notifyAt: now + NOTIFY_DELAY_MS });
  next = annul(next, (x) => x.target === v.codename);
  return checkVictory(next);
}

function failAttempt(s: RoomState, id: number, now: number): RoomState {
  return active(s, id) ? { ...patchAttempt(s, id, { status: "falha" }), cooldownUntil: now + COOLDOWN_MS } : s;
}

/** Prazos vencidos: fim de janelas e abandono por ausência. Idempotente (pode rodar várias vezes). */
export function tick(s: RoomState, now: number): RoomState {
  let next = s;
  for (const a of s.attempts) {
    if (next.phase !== "partida") return next;
    if (a.status !== "ativa" || a.endsAt === null || a.endsAt > now) continue;
    next = a.rule === "silencioso" ? succeed(next, a.id, a.endsAt) : failAttempt(next, a.id, a.endsAt);
  }
  for (const p of s.players) {
    if (next.phase !== "partida") return next;
    if (p.alive && p.awaySince !== null && now - p.awaySince >= ABANDON_AFTER_MS) next = eliminate(next, p.codename, true);
  }
  return next;
}

/** Próximo instante em que o servidor precisa acordar (alarm). */
export function nextWake(s: RoomState, now: number): number | null {
  if (s.phase !== "partida") return null;
  const times = [
    ...s.attempts.filter((a) => a.status === "ativa" && a.endsAt !== null).map((a) => a.endsAt!),
    ...s.players.filter((p) => p.alive && p.awaySince !== null).map((p) => p.awaySince! + ABANDON_AFTER_MS),
    ...s.players.map((p) => p.notifyAt ?? 0),
    s.fakeNotifyAt ?? 0,
  ].filter((t) => t > now);
  return times.length ? Math.min(...times) : null;
}

const norm = (t: string) => t.normalize("NFC").toLocaleLowerCase("pt-BR");
/** Eco: palavra inteira, sem tirar acentos (INFECCAO.md §3.7). */
export const wordsOf = (t: string): string[] => norm(t).match(/\p{L}+/gu) ?? [];
const countWord = (text: string, w: string) => wordsOf(text).filter((x) => x === w).length;

/** Silencioso: ações públicas do alvo quebram o silêncio. */
function publicAction(s: RoomState, codename: string, now: number): RoomState {
  let next = s;
  for (const a of s.attempts) {
    if (a.status === "ativa" && a.rule === "silencioso" && a.target === codename) next = failAttempt(next, a.id, now);
  }
  return next;
}

/** Avalia uma mensagem nova contra as tentativas ativas. */
export function afterMessage(s: RoomState, msg: ChatMessage, now: number): RoomState {
  if (s.phase !== "partida" || msg.system) return s;
  const monster = monsterOf(s).codename;
  let next = s;
  for (const { id } of s.attempts) {
    if (next.phase !== "partida") break;
    const a = active(next, id);
    if (!a) continue;
    // Anfitrião: mensagem do Monstro para a vítima tira a iniciativa dela (Q-07).
    if (a.rule === "anfitriao" && msg.from === monster && msg.to === a.target) next = failAttempt(next, id, now);
    if (msg.from !== a.target) continue;
    if (a.rule === "silencioso" && msg.to === null) next = failAttempt(next, id, now);
    else if (a.rule === "anfitriao" && msg.to === monster) next = succeed(next, id, now);
    else if (a.rule === "eco") {
      const count = a.count + countWord(msg.text, a.word!);
      next = patchAttempt(next, id, { count });
      if (count >= ECO_TARGET) next = succeed(next, id, now);
    }
  }
  return next;
}

/** D-52: o Monstro escolhe qual Monstro usar, uma vez. */
export function chooseMonster(s: RoomState, userId: string, id: unknown): Result<RoomState> {
  const me = playerOf(s, userId);
  if (s.phase !== "partida" || !me?.alive || me.role !== "monstro" || s.monsterType) return fail("acao_invalida");
  if (!IMPLEMENTED_MONSTERS.includes(id as MonsterId)) return fail("monstro_indisponivel");
  return ok({ ...s, monsterType: id as MonsterId });
}

export interface InfectRequest {
  target: string;
  bait?: number;
  word?: string;
}

/** INFECTAR (INFECCAO.md §1, §3). O cliente só manda a intenção; tudo é validado aqui. */
export function infect(s: RoomState, userId: string, req: InfectRequest, messages: readonly ChatMessage[], now: number): Result<RoomState> {
  const me = playerOf(s, userId);
  if (s.phase !== "partida" || !me?.alive || me.role !== "monstro") return fail("acao_invalida");
  const rule = s.monsterType;
  if (!rule) return fail("monstro_nao_escolhido");
  if (now < s.cooldownUntil) return fail("em_recarga");
  const v = byCodename(s, req.target);
  if (!v || v === me || !v.alive || v.infectedAt !== null || v.awaySince !== null) return fail("alvo_invalido");
  const running = s.attempts.filter((a) => a.status === "ativa");
  if (running.length >= (MAX_ACTIVE[rule] ?? 1)) return fail("limite_de_tentativas");
  const bait = messages.find((m) => m.seq === req.bait && !m.system && canSee(m, me.codename));

  let baitSeq: number | null = null;
  let word: string | null = null;
  if (rule === "silencioso") {
    // Isca: mensagem própria no chat público.
    if (!bait || bait.from !== me.codename || bait.to !== null) return fail("isca_invalida");
    baitSeq = bait.seq;
  } else if (rule === "eco") {
    // Isca: uma palavra de mensagem já enviada pela vítima. shortcut: sem dicionário de substantivos (Q-05) ainda.
    const w = typeof req.word === "string" ? wordsOf(req.word) : [];
    if (!bait || bait.from !== v.codename || w.length !== 1 || countWord(bait.text, w[0]!) === 0) return fail("isca_invalida");
    const first = running[0];
    if (first && (now < first.openedAt + ECO_SECOND_SLOT_MS || first.word === w[0])) return fail("limite_de_tentativas");
    baitSeq = bait.seq;
    word = w[0]!;
  } else if (rule !== "anfitriao") {
    return fail("monstro_indisponivel");
  }
  const win = WINDOW_MS[rule];
  const attempt: Attempt = {
    id: s.nextAttemptId, rule, target: v.codename, baitSeq, word, openedAt: now,
    endsAt: win ? now + win : null, status: "ativa", count: 0,
  };
  return ok({ ...s, nextAttemptId: s.nextAttemptId + 1, attempts: [...s.attempts, attempt] });
}

/** Q-05: o Monstro pode cancelar uma tentativa do Eco (sem recarga). */
export function cancelInfect(s: RoomState, userId: string, id: unknown): Result<RoomState> {
  const me = playerOf(s, userId);
  const a = typeof id === "number" ? active(s, id) : undefined;
  if (s.phase !== "partida" || me?.role !== "monstro" || !a || a.rule !== "eco") return fail("acao_invalida");
  return ok(patchAttempt(s, a.id, { status: "anulada" }));
}

/** D-54: infectar a si mesmo é só simulação: aparece para o Monstro como para uma vítima, sem contar para vitória. */
export function selfInfect(s: RoomState, userId: string, now: number): Result<RoomState> {
  const me = playerOf(s, userId);
  if (s.phase !== "partida" || !me?.alive || me.role !== "monstro" || s.fakeNotifyAt !== null) return fail("acao_invalida");
  return ok({ ...s, fakeNotifyAt: now + NOTIFY_DELAY_MS });
}

export type GunAction = "pegar" | "largar" | "permitir" | "disparar";
export const GUN_ACTIONS: readonly GunAction[] = ["pegar", "largar", "permitir", "disparar"];

/**
 * Revólver (GDD §4, D-49). Retorna o aviso público a publicar no chat.
 * O Monstro pode pegar, mas nunca dispara: recebe "disparo_negado" só para ele e nada é publicado.
 */
export function gunAction(
  s: RoomState, userId: string, action: GunAction, target: unknown, now: number,
): Result<{ state: RoomState; notice: string }> {
  const me = playerOf(s, userId);
  if (s.phase !== "partida" || !me?.alive) return fail("fora_da_partida");
  const g = s.gun;
  const mine = g.holder === me.codename;
  switch (action) {
    case "pegar":
      if (g.holder !== null) return fail("acao_invalida");
      return ok({ state: publicAction({ ...s, gun: { ...g, holder: me.codename, armed: false } }, me.codename, now), notice: `${me.codename} pegou o revólver` });
    case "largar":
      if (!mine) return fail("acao_invalida");
      return ok({ state: { ...s, gun: { ...g, holder: null, armed: false } }, notice: `${me.codename} largou o revólver` });
    case "permitir":
      if (g.holder === null || mine || g.armed || g.bullets <= 0) return fail("acao_invalida");
      return ok({ state: publicAction({ ...s, gun: { ...g, armed: true } }, me.codename, now), notice: `${me.codename} permitiu um disparo` });
    case "disparar": {
      const v = byCodename(s, target);
      if (!mine || !g.armed || g.bullets <= 0 || !v || v === me || !v.alive) return fail("acao_invalida");
      if (me.role === "monstro") return fail("disparo_negado");
      let next = publicAction({ ...s, gun: { ...g, bullets: g.bullets - 1, armed: false } }, me.codename, now);
      next = eliminate(next, v.codename, false);
      return ok({ state: next, notice: `${me.codename} atirou em ${v.codename}` });
    }
  }
}
