import { describe, expect, it } from "vitest";
import {
  ABANDON_AFTER_MS, afterMessage, cancelInfect, chooseMonster, COOLDOWN_MS, createRoom, gunAction, infect, join, markAway,
  markBack, nextWake, NOTIFY_DELAY_MS, postPrivate, postPublic, secureRandomInt, selfInfect, startMatch, tick, viewFor,
  type ChatMessage, type MonsterId, type Result, type RoomState,
} from "../src/index";

const must = <T>(r: Result<T>): T => {
  if (!r.ok) throw new Error(r.error);
  return r.value;
};

function setup(type: MonsterId | null = null) {
  let s = createRoom("ABC234", "u0", 0);
  for (const u of ["u1", "u2", "u3"]) s = must(join(s, u)).state;
  s = must(startMatch(s, secureRandomInt, 0));
  const M = s.players.find((p) => p.role === "monstro")!;
  const [A, B, C] = s.players.filter((p) => p.role === "inocente") as [typeof M, typeof M, typeof M];
  if (type) s = must(chooseMonster(s, M.userId, type));
  const msgs: ChatMessage[] = [];
  /** Envia (público ou PV) e passa pelo motor, como o servidor faz. */
  const say = (st: RoomState, userId: string, text: string, now: number, to?: string) => {
    const r = must(to ? postPrivate(st, userId, to, text, now) : postPublic(st, userId, text, now));
    msgs.push(r.message);
    return afterMessage(r.state, r.message, now);
  };
  return { s, M, A, B, C, msgs, say };
}

const gun = (s: RoomState, uid: string, action: "pegar" | "largar" | "permitir" | "disparar", target?: string) =>
  gunAction(s, uid, action, target, 1);

describe("revólver (D-49)", () => {
  it("pegar é público, disparo exige permissão de outro jogador, e matar o Monstro dá vitória aos Inocentes", () => {
    let { s, M, A, B } = setup();
    const took = must(gun(s, A.userId, "pegar"));
    expect(took.notice).toBe(`${A.codename} pegou o revólver`);
    s = took.state;
    expect(gun(s, B.userId, "pegar")).toEqual({ ok: false, error: "acao_invalida" }); // não pode ser tomado
    expect(gun(s, A.userId, "disparar", M.codename)).toEqual({ ok: false, error: "acao_invalida" }); // sem permissão
    expect(gun(s, A.userId, "permitir")).toEqual({ ok: false, error: "acao_invalida" }); // o portador não se autoriza
    s = must(gun(s, B.userId, "permitir")).state;
    s = must(gun(s, A.userId, "disparar", M.codename)).state;
    expect(s.result).toMatchObject({ winner: "inocentes", reason: "monstro_morto" });
  });

  it("cada disparo exige nova permissão; 2 balas; restando só o Monstro e 1 Inocente, o Monstro vence", () => {
    let { s, A, B, C } = setup();
    s = must(gun(s, A.userId, "pegar")).state;
    s = must(gun(s, C.userId, "permitir")).state;
    s = must(gun(s, A.userId, "disparar", B.codename)).state;
    expect(s.gun).toEqual({ holder: A.codename, bullets: 1, armed: false });
    expect(s.phase).toBe("partida");
    expect(gun(s, A.userId, "disparar", C.codename)).toEqual({ ok: false, error: "acao_invalida" });
    expect(gun(s, B.userId, "permitir")).toEqual({ ok: false, error: "fora_da_partida" }); // morto não age
    s = must(gun(s, C.userId, "permitir")).state;
    s = must(gun(s, A.userId, "disparar", C.codename)).state;
    expect(s.result).toMatchObject({ winner: "monstro", reason: "ultimo_inocente" });
  });

  it("o Monstro pega e recebe permissão, mas nunca dispara, e nada é publicado", () => {
    let { s, M, A } = setup();
    s = must(gun(s, M.userId, "pegar")).state;
    s = must(gun(s, A.userId, "permitir")).state;
    expect(gun(s, M.userId, "disparar", A.codename)).toEqual({ ok: false, error: "disparo_negado" });
    expect(must(gun(s, M.userId, "largar")).state.gun.holder).toBeNull();
  });
});

describe("abandono (D-50)", () => {
  it("mais de 1 min desconectado = abandono; voltar antes cancela", () => {
    const { s, A } = setup();
    const away = markAway(s, A.userId, 1000);
    expect(nextWake(away, 1000)).toBe(1000 + ABANDON_AFTER_MS);
    expect(tick(markBack(away, A.userId), 1000 + ABANDON_AFTER_MS).players.find((p) => p.userId === A.userId)!.alive).toBe(true);
    const gone = tick(away, 1000 + ABANDON_AFTER_MS);
    expect(gone.players.find((p) => p.userId === A.userId)).toMatchObject({ alive: false, abandoned: true });
  });

  it("Monstro fora por mais de 1 min → Inocentes vencem", () => {
    const { s, M } = setup();
    expect(tick(markAway(s, M.userId, 0), ABANDON_AFTER_MS).result).toMatchObject({ winner: "inocentes", reason: "monstro_abandonou" });
  });
});

describe("Silencioso (INFECCAO §3.3)", () => {
  it("isca pública do Monstro + 80 s sem interação pública da vítima → infecção; vítima só vê depois de 2 min", () => {
    let { s, M, A, msgs, say } = setup("silencioso");
    expect(infect(s, M.userId, { target: A.codename }, msgs, 1)).toEqual({ ok: false, error: "isca_invalida" });
    s = say(s, M.userId, "alguém aqui está quieto demais", 1);
    s = must(infect(s, M.userId, { target: A.codename, bait: msgs[0]!.seq }, msgs, 2));
    s = say(s, A.userId, "no PV pode", 3, M.codename); // PV não quebra o silêncio
    expect(nextWake(s, 3)).toBe(2 + 80_000);
    s = tick(s, 2 + 80_000);
    expect(s.attempts[0]!.status).toBe("sucesso");
    expect(viewFor(s, A.userId, msgs, new Set(), 2 + 80_000).me!.infected).toBe(false);
    expect(viewFor(s, A.userId, msgs, new Set(), 2 + 80_000 + NOTIFY_DELAY_MS).me!.infected).toBe(true);
    expect(viewFor(s, M.userId, msgs, new Set(), 2 + 80_000).me!.monster!.infected).toEqual([A.codename]);
    expect(infect(s, M.userId, { target: A.codename, bait: msgs[0]!.seq }, msgs, 90_000)).toEqual({ ok: false, error: "alvo_invalido" });
  });

  it("mensagem pública ou pegar o revólver quebram o silêncio e geram recarga de 60 s; queda anula sem recarga", () => {
    let { s, M, A, B, msgs, say } = setup("silencioso");
    s = say(s, M.userId, "isca", 1);
    const opened = must(infect(s, M.userId, { target: A.codename, bait: 1 }, msgs, 2));
    s = must(gunAction(opened, A.userId, "pegar", undefined, 5)).state;
    expect(s.attempts[0]!.status).toBe("falha");
    expect(s.cooldownUntil).toBe(5 + COOLDOWN_MS);
    expect(infect(s, M.userId, { target: B.codename, bait: 1 }, msgs, 6)).toEqual({ ok: false, error: "em_recarga" });
    const dropped = markAway(opened, A.userId, 5);
    expect(dropped.attempts[0]!.status).toBe("anulada");
    expect(dropped.cooldownUntil).toBe(0);
  });
});

describe("Anfitrião (INFECCAO §3.9)", () => {
  it("a vítima puxa conversa no PV do Monstro em até 25 s → infecção", () => {
    let { s, M, A, msgs, say } = setup("anfitriao");
    s = must(infect(s, M.userId, { target: A.codename }, msgs, 0));
    s = say(s, A.userId, "ei, posso falar com você?", 10_000, M.codename);
    expect(s.attempts[0]!.status).toBe("sucesso");
  });

  it("se o Monstro escreve primeiro, não é iniciativa (Q-07); sem mensagem em 25 s → falha", () => {
    let { s, M, A, msgs, say } = setup("anfitriao");
    const opened = must(infect(s, M.userId, { target: A.codename }, msgs, 0));
    s = say(opened, M.userId, "oi", 1, A.codename);
    expect(s.attempts[0]!.status).toBe("falha");
    const late = tick(opened, 25_000);
    expect(late.attempts[0]!.status).toBe("falha");
    expect(late.cooldownUntil).toBe(25_000 + COOLDOWN_MS);
  });
});

describe("Eco (INFECCAO §3.7)", () => {
  it("palavra exata da vítima repetida 4 vezes, em qualquer canal → infecção; acento importa", () => {
    let { s, M, A, B, msgs, say } = setup("eco");
    s = say(s, A.userId, "O farol apagou ontem", 1);
    expect(infect(s, M.userId, { target: A.codename, bait: 1, word: "lua" }, msgs, 2)).toEqual({ ok: false, error: "isca_invalida" });
    s = must(infect(s, M.userId, { target: A.codename, bait: 1, word: "Farol" }, msgs, 2));
    s = say(s, A.userId, "farol farol", 3); // 2 no mesmo texto = 2 pontos (Q-05)
    s = say(s, A.userId, "faróis não contam", 4);
    s = say(s, B.userId, "farol", 5); // outro jogador não conta
    s = say(s, A.userId, "o FAROL", 6, M.codename);
    expect(s.attempts[0]!.count).toBe(3);
    s = say(s, A.userId, "farol!", 7);
    expect(s.attempts[0]!.status).toBe("sucesso");
  });

  it("2ª vaga só 2 min depois, com palavra diferente; o Monstro pode cancelar", () => {
    let { s, M, A, B, msgs, say } = setup("eco");
    s = say(s, A.userId, "medo do escuro", 1);
    s = say(s, B.userId, "medo de quê", 2);
    s = must(infect(s, M.userId, { target: A.codename, bait: 1, word: "medo" }, msgs, 3));
    expect(infect(s, M.userId, { target: B.codename, bait: 2, word: "quê" }, msgs, 4)).toEqual({ ok: false, error: "limite_de_tentativas" });
    expect(infect(s, M.userId, { target: B.codename, bait: 2, word: "medo" }, msgs, 3 + 120_000)).toEqual({ ok: false, error: "limite_de_tentativas" });
    s = must(infect(s, M.userId, { target: B.codename, bait: 2, word: "quê" }, msgs, 3 + 120_000));
    s = must(cancelInfect(s, M.userId, 1));
    expect(s.attempts.map((a) => a.status)).toEqual(["anulada", "ativa"]);
    expect(s.cooldownUntil).toBe(0);
  });
});

describe("vitória por infecção e auto-infecção (GDD §3, D-54)", () => {
  it("os 3 Inocentes infectados → Monstro vence; auto-infecção aparece só para o Monstro e não conta", () => {
    let { s, M, A, B, C, msgs, say } = setup("anfitriao");
    s = must(selfInfect(s, M.userId, 0));
    expect(selfInfect(s, M.userId, 1)).toEqual({ ok: false, error: "acao_invalida" });
    expect(viewFor(s, M.userId, msgs, new Set(), NOTIFY_DELAY_MS).me!.infected).toBe(true);
    let t = 10;
    for (const v of [A, B, C]) {
      expect(s.phase).toBe("partida");
      s = must(infect(s, M.userId, { target: v.codename }, msgs, t));
      s = say(s, v.userId, "oi", t + 1, M.codename);
      t += 10;
    }
    expect(s.result).toEqual({ winner: "monstro", reason: "infeccao", monster: { codename: M.codename, type: "anfitriao" } });
  });

  it("só o Monstro escolhe, uma vez, entre os Monstros implementados", () => {
    const { s, M, A } = setup();
    expect(chooseMonster(s, A.userId, "eco")).toEqual({ ok: false, error: "acao_invalida" });
    expect(chooseMonster(s, M.userId, "reflexo")).toEqual({ ok: false, error: "monstro_indisponivel" });
    expect(infect(s, M.userId, { target: A.codename }, [], 0)).toEqual({ ok: false, error: "monstro_nao_escolhido" });
    expect(chooseMonster(must(chooseMonster(s, M.userId, "eco")), M.userId, "silencioso")).toEqual({ ok: false, error: "acao_invalida" });
  });
});
