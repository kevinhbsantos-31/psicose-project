// Modo prévia (EXPO_PUBLIC_PREVIEW=1): sala simulada no próprio aparelho, usando as MESMAS regras do servidor
// (packages/rules). Não toca no Supabase nem no servidor. Só serve para ver a interface no Expo Go.
import {
  createRoom, join, leave, postPrivate, postPublic, startMatch, viewFor,
  type ChatMessage, type ClientMessage, type RoomState, type ServerError, type Snapshot,
} from "@psicose/rules";
import { useCallback, useEffect, useRef, useState } from "react";
import { ERROR_TEXT, type Status } from "./room";

export const PREVIEW_ROOM_CODE = "VHS666";

const ME = "previa-voce";
const BOTS = ["previa-2", "previa-3", "previa-4"];
const BOT_LINES = ["Alguém mais ouviu esse chiado?", "Quem pegou o revólver?", "Eu não confio em ninguém aqui.", "A fita travou de novo..."];
const fakeRng = (max: number) => Math.floor(Math.random() * max); // só na prévia; o servidor usa RNG criptográfico

type Posted = { ok: true; value: { state: RoomState; message: ChatMessage } } | { ok: false; error: string };

export function usePreviewRoom(code: string) {
  const state = useRef<RoomState>(createRoom(code, ME, Date.now()));
  const messages = useRef<ChatMessage[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [ended, setEnded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const render = useCallback(() => {
    setSnapshot(viewFor(state.current, ME, messages.current, new Set([ME, ...BOTS])));
  }, []);

  const apply = useCallback(
    (r: Posted) => {
      if (!r.ok) return setError(ERROR_TEXT[r.error as ServerError] ?? r.error);
      state.current = r.value.state;
      messages.current.push(r.value.message);
      render();
    },
    [render],
  );

  useEffect(() => {
    render();
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Os 3 "jogadores" simulados entram um a um; com o 4º a partida começa sozinha (D-25).
    BOTS.forEach((bot, i) =>
      timers.push(
        setTimeout(() => {
          const r = join(state.current, bot);
          if (!r.ok) return;
          state.current = r.value.state;
          if (state.current.seats.length === 4) {
            const s = startMatch(state.current, fakeRng, Date.now());
            if (s.ok) state.current = s.value;
          }
          render();
        }, 1500 * (i + 1)),
      ),
    );
    // Conversa simulada no chat público.
    BOT_LINES.forEach((line, i) =>
      timers.push(setTimeout(() => apply(postPublic(state.current, BOTS[i % BOTS.length]!, line, Date.now())), 7000 + i * 6000)),
    );
    // Para mostrar a tela de fim: se você for Inocente, o Monstro simulado abandona depois de 60 s (D-31).
    timers.push(
      setTimeout(() => {
        const monster = state.current.players.find((p) => p.role === "monstro");
        if (monster && monster.userId !== ME) {
          state.current = leave(state.current, monster.userId);
          render();
        }
      }, 60000),
    );
    return () => timers.forEach(clearTimeout);
  }, [apply, render]);

  const send = useCallback(
    (m: ClientMessage) => {
      const now = Date.now();
      if (m.t === "leave") {
        state.current = leave(state.current, ME);
        setEnded("Você saiu da sala.");
      } else if (m.t === "chat") apply(postPublic(state.current, ME, m.text, now));
      else apply(postPrivate(state.current, ME, m.to, m.text, now));
    },
    [apply],
  );

  const status: Status = "conectado";
  return { snapshot, status, ended, error, send, clearError: useCallback(() => setError(null), []) };
}
