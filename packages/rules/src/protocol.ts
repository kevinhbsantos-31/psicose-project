import type { ChatMessage, RuleError, Snapshot } from "./room";

/** Intenções enviadas pelo app. O servidor valida tudo. */
export type ClientMessage =
  | { t: "leave" }
  | { t: "chat"; text: string }
  | { t: "pm"; to: string; text: string };

export type ServerError = RuleError | "mensagem_malformada" | "sala_inexistente";

export type ServerMessage =
  | { t: "snapshot"; snapshot: Snapshot }
  | { t: "msg"; message: ChatMessage }
  | { t: "error"; error: ServerError };

/** Códigos de fechamento do WebSocket (4000–4999 são livres para a aplicação). */
export const CloseCode = {
  saiu: 4000,
  nao_autenticado: 4001,
  sala_inexistente: 4004,
  sala_cheia: 4009,
  partida_em_andamento: 4010,
  substituida: 4011,
  abandonou: 4012,
} as const;

const MAX_RAW_LENGTH = 4096;

/** Valida a forma da mensagem do cliente. Conteúdo (tamanho do texto etc.) é validado pelas regras. */
export function parseClientMessage(raw: unknown): ClientMessage | null {
  if (typeof raw !== "string" || raw.length > MAX_RAW_LENGTH) return null;
  let m: unknown;
  try {
    m = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof m !== "object" || m === null) return null;
  const o = m as Record<string, unknown>;
  switch (o.t) {
    case "leave":
      return { t: "leave" };
    case "chat":
      return typeof o.text === "string" ? { t: "chat", text: o.text } : null;
    case "pm":
      return typeof o.text === "string" && typeof o.to === "string" ? { t: "pm", to: o.to, text: o.text } : null;
    default:
      return null;
  }
}
