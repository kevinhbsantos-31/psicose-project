import { CloseCode, type ClientMessage, type ServerError, type ServerMessage, type Snapshot } from "@psicose/rules";
import PartySocket from "partysocket";
import { useCallback, useEffect, useRef, useState } from "react";
import { config } from "./config";
import { accessToken } from "./supabase";

export const ERROR_TEXT: Record<ServerError, string> = {
  sala_inexistente: "Sala não encontrada. Confira o código.",
  sala_cheia: "A sala já tem 4 jogadores.",
  partida_em_andamento: "A partida já começou.",
  abandonou: "Você abandonou esta partida e não pode voltar.",
  jogadores_insuficientes: "A partida precisa de exatamente 4 jogadores.",
  fora_da_partida: "O chat abre quando a partida começa.",
  mensagem_invalida: "Mensagem vazia ou longa demais (máximo de 500 caracteres).",
  destinatario_invalido: "Destinatário inválido.",
  mensagem_malformada: "Erro de comunicação com o servidor.",
  acao_invalida: "Ação indisponível agora.",
  disparo_negado: "O revólver não dispara nas suas mãos.",
  monstro_nao_escolhido: "Escolha o seu Monstro primeiro.",
  monstro_indisponivel: "Este Monstro ainda não está disponível.",
  em_recarga: "Aguarde a recarga para tentar de novo.",
  alvo_invalido: "Este alvo não pode ser infectado agora.",
  isca_invalida: "Isca inválida para este Monstro.",
  limite_de_tentativas: "Limite de tentativas simultâneas atingido.",
};

/** Fechamentos definitivos: não adianta reconectar. */
const FINAL_CLOSE: Record<number, string> = {
  [CloseCode.saiu]: "Você saiu da sala.",
  [CloseCode.substituida]: "Esta sala foi aberta em outro aparelho.",
  [CloseCode.sala_inexistente]: ERROR_TEXT.sala_inexistente,
  [CloseCode.sala_cheia]: ERROR_TEXT.sala_cheia,
  [CloseCode.partida_em_andamento]: ERROR_TEXT.partida_em_andamento,
  [CloseCode.abandonou]: ERROR_TEXT.abandonou,
};

export type Status = "conectando" | "conectado" | "reconectando" | "encerrado";

export async function createRoom(): Promise<string> {
  const res = await fetch(`${config.serverUrl}/rooms`, {
    method: "POST",
    headers: { authorization: `Bearer ${await accessToken()}` },
  });
  if (res.status === 401) throw new Error("Sessão expirada. Entre novamente.");
  if (!res.ok) throw new Error("Não foi possível criar a sala.");
  return ((await res.json()) as { code: string }).code;
}

/** Conexão com a sala. Reconecta sozinha (com token renovado) até um fechamento definitivo. */
export function useRoom(code: string) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [status, setStatus] = useState<Status>("conectando");
  const [ended, setEnded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socket = useRef<PartySocket | null>(null);

  useEffect(() => {
    const ws = new PartySocket({
      host: config.serverHost,
      protocol: config.serverSecure ? "wss" : "ws",
      party: "room",
      room: code,
      query: async () => ({ token: await accessToken() }),
    });
    socket.current = ws;
    ws.addEventListener("open", () => setStatus("conectado"));
    ws.addEventListener("close", (e) => {
      const reason = FINAL_CLOSE[e.code];
      if (reason) {
        ws.close(); // interrompe a reconexão automática
        setStatus("encerrado");
        setEnded(reason);
      } else {
        setStatus("reconectando");
      }
    });
    ws.addEventListener("message", (e) => {
      const m = JSON.parse(String(e.data)) as ServerMessage;
      if (m.t === "snapshot") setSnapshot(m.snapshot);
      else if (m.t === "msg")
        setSnapshot((s) => (s && !s.messages.some((x) => x.seq === m.message.seq) ? { ...s, messages: [...s.messages, m.message] } : s));
      else setError(ERROR_TEXT[m.error] ?? m.error);
    });
    return () => ws.close();
  }, [code]);

  const send = useCallback((m: ClientMessage) => socket.current?.send(JSON.stringify(m)), []);
  const clearError = useCallback(() => setError(null), []);
  return { snapshot, status, ended, error, send, clearError };
}
