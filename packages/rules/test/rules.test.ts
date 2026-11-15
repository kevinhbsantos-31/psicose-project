import { describe, expect, it } from "vitest";
import {
  audienceOf, createRoom, generateRoomCode, isRoomCode, join, leave, MAX_MESSAGE_LENGTH, parseClientMessage, playerOf,
  postPrivate, postPublic, secureRandomInt, startMatch, viewFor, type RoomState,
} from "../src/index";

const U = ["user-a", "user-b", "user-c", "user-d"] as const;
const rng0 = () => 0; // determinístico

function lobbyFull(): RoomState {
  let s = createRoom("ABC234", U[0], 1);
  for (const u of U.slice(1)) {
    const r = join(s, u);
    if (!r.ok) throw new Error(r.error);
    s = r.value.state;
  }
  return s;
}

function started(): RoomState {
  const r = startMatch(lobbyFull(), secureRandomInt, 2);
  if (!r.ok) throw new Error(r.error);
  return r.value;
}

describe("lobby", () => {
  it("aceita até 4 jogadores e recusa o quinto", () => {
    const s = lobbyFull();
    expect(s.seats).toEqual([...U]);
    expect(join(s, "user-e")).toEqual({ ok: false, error: "sala_cheia" });
  });

  it("reconexão devolve a mesma vaga sem duplicar", () => {
    const r = join(lobbyFull(), U[2]);
    expect(r.ok && r.value.rejoined && r.value.state.seats.length === 4).toBe(true);
  });

  it("sair do lobby libera a vaga para outro jogador", () => {
    const s = leave(lobbyFull(), U[0]);
    expect(s.seats).toEqual([U[1], U[2], U[3]]);
    expect(join(s, "user-e").ok).toBe(true);
  });

  it("partida só começa com exatamente 4", () => {
    expect(startMatch(createRoom("ABC234", U[0], 1), rng0, 2)).toEqual({ ok: false, error: "jogadores_insuficientes" });
  });
});

describe("início da partida", () => {
  it("sorteia exatamente 1 Monstro e 3 Inocentes com codinomes únicos", () => {
    for (let i = 0; i < 50; i++) {
      const s = started();
      expect(s.phase).toBe("partida");
      expect(s.players.filter((p) => p.role === "monstro")).toHaveLength(1);
      expect(new Set(s.players.map((p) => p.codename)).size).toBe(4);
      expect(new Set(s.players.map((p) => p.userId))).toEqual(new Set(U));
    }
  });

  it("não aceita novos jogadores nem reinício", () => {
    const s = started();
    expect(join(s, "user-e")).toEqual({ ok: false, error: "partida_em_andamento" });
    expect(startMatch(s, rng0, 3)).toEqual({ ok: false, error: "partida_em_andamento" });
  });

  it("queda de conexão: o jogador da partida reconecta", () => {
    expect(join(started(), U[3]).ok).toBe(true);
  });

  it("sair durante a partida é abandono definitivo", () => {
    const s0 = started();
    const quitter = s0.players.find((p) => p.role === "inocente")!;
    const other = s0.players.find((p) => p !== quitter)!;
    const s = leave(s0, quitter.userId);
    expect(s.phase).toBe("partida"); // abandono de Inocente não encerra (D-31 trata só do Monstro)
    expect(playerOf(s, quitter.userId)!.abandoned).toBe(true);
    expect(s.seats).toEqual(s0.seats); // a vaga não é liberada para outra pessoa
    expect(join(s, quitter.userId)).toEqual({ ok: false, error: "abandonou" });
    expect(postPublic(s, quitter.userId, "oi", 3)).toEqual({ ok: false, error: "fora_da_partida" });
    expect(postPrivate(s, other.userId, quitter.codename, "oi", 3)).toEqual({ ok: false, error: "destinatario_invalido" });
    expect(viewFor(s, other.userId, [], new Set()).players.find((p) => p.codename === quitter.codename)!.abandoned).toBe(true);
    expect(leave(s, quitter.userId)).toBe(s);
  });

  it("D-31: Monstro abandona → Inocentes vencem na hora e a partida fecha", () => {
    const s0 = started();
    const monster = s0.players.find((p) => p.role === "monstro")!;
    const innocent = s0.players.find((p) => p.role === "inocente")!;
    const s = leave(s0, monster.userId);
    expect(s.phase).toBe("encerrada");
    expect(s.result).toEqual({ winner: "inocentes", reason: "monstro_abandonou" });
    expect(viewFor(s, innocent.userId, [], new Set()).result).toEqual(s.result);
    expect(postPublic(s, innocent.userId, "oi", 3)).toEqual({ ok: false, error: "fora_da_partida" });
    expect(join(s, innocent.userId).ok).toBe(true); // os demais podem reabrir e ver o resultado
    expect(leave(s, innocent.userId)).toBe(s); // depois de encerrada, nada muda
  });

  it("D-31 não dispara sem abandono: partida em andamento não tem resultado", () => {
    const s = started();
    expect(s.result).toBeNull();
    expect(join(s, s.players.find((p) => p.role === "monstro")!.userId).ok).toBe(true); // reconexão do Monstro
  });
});

describe("chat", () => {
  it("não existe antes da partida", () => {
    expect(postPublic(lobbyFull(), U[0], "oi", 3)).toEqual({ ok: false, error: "fora_da_partida" });
    expect(postPrivate(lobbyFull(), U[0], "Âmbar", "oi", 3)).toEqual({ ok: false, error: "fora_da_partida" });
  });

  it("valida o texto e numera as mensagens", () => {
    const s = started();
    expect(postPublic(s, U[0], "   ", 3)).toEqual({ ok: false, error: "mensagem_invalida" });
    expect(postPublic(s, U[0], "x".repeat(MAX_MESSAGE_LENGTH + 1), 3)).toEqual({ ok: false, error: "mensagem_invalida" });
    const r = postPublic(s, U[0], "  olá  ", 3);
    expect(r.ok && r.value.message.text === "olá" && r.value.message.seq === 1 && r.value.state.nextMsgSeq === 2).toBe(true);
  });

  it("mensagem privada vai só ao remetente e ao destinatário", () => {
    const s = started();
    const [a, b] = s.players;
    expect(postPrivate(s, a!.userId, a!.codename, "eu", 3)).toEqual({ ok: false, error: "destinatario_invalido" });
    expect(postPrivate(s, a!.userId, "Ninguém", "x", 3)).toEqual({ ok: false, error: "destinatario_invalido" });
    const r = postPrivate(s, a!.userId, b!.codename, "segredo", 3);
    if (!r.ok) throw new Error(r.error);
    expect(new Set(audienceOf(s, r.value.message))).toEqual(new Set([a!.userId, b!.userId]));
  });
});

describe("visão por jogador", () => {
  it("mostra só o próprio papel, filtra mensagens privadas e nunca expõe ids de conta", () => {
    let s = started();
    const [a, b, c] = s.players;
    const r = postPrivate(s, a!.userId, b!.codename, "só para b", 3);
    if (!r.ok) throw new Error(r.error);
    s = r.value.state;
    const msgs = [r.value.message];

    const vc = viewFor(s, c!.userId, msgs, new Set(U));
    expect(vc.me).toEqual({ codename: c!.codename, role: c!.role });
    expect(vc.players.every((p) => !("role" in p))).toBe(true);
    expect(vc.messages).toHaveLength(0);
    expect(viewFor(s, b!.userId, msgs, new Set()).messages).toHaveLength(1);
    expect(JSON.stringify(vc)).not.toContain("user-");
  });

  it("no lobby não revela identidades", () => {
    const v = viewFor(lobbyFull(), U[1], [], new Set([U[0]]));
    expect(v.seats).toEqual([
      { you: false, online: true }, { you: true, online: false }, { you: false, online: false }, { you: false, online: false },
    ]);
    expect(JSON.stringify(v)).not.toContain("user-");
  });
});

describe("protocolo e utilidades", () => {
  it("rejeita mensagens malformadas", () => {
    expect(parseClientMessage("{")).toBeNull();
    expect(parseClientMessage('{"t":"pm","text":"x"}')).toBeNull();
    expect(parseClientMessage('{"t":"hack"}')).toBeNull();
    expect(parseClientMessage("x".repeat(5000))).toBeNull();
    expect(parseClientMessage('{"t":"chat","text":"oi"}')).toEqual({ t: "chat", text: "oi" });
  });

  it("gera códigos de sala válidos e RNG dentro do intervalo", () => {
    for (let i = 0; i < 200; i++) {
      expect(isRoomCode(generateRoomCode(secureRandomInt))).toBe(true);
      const n = secureRandomInt(4);
      expect(n >= 0 && n < 4).toBe(true);
    }
    expect(isRoomCode("ABC10O")).toBe(false);
  });
});
