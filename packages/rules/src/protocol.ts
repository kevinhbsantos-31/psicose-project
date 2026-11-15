import { GUN_ACTIONS, type GunAction } from "./match";
import type { ChatMessage, RuleError, Snapshot } from "./room";

/** Intenções enviadas pelo app. O servidor valida tudo. */
export type ClientMessage =
  | { t: "leave" }
  | { t: "chat"; text: string }
  | { t: "pm"; to: string; text: string }
  | { t: "monster"; id: string }
  | { t: "gun"; action: GunAction; target?: string }
  | { t: "infect"; target: string; bait?: number; word?: string }
  | { t: "infect_cancel"; id: number }
  | { t: "self_infect" };

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

const str = (v: unknown): v is string => typeof v === "string";
const optStr = (v: unknown) => v === undefined || str(v);
const optInt = (v: unknown) => v === undefined || Number.isInteger(v);

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
    case "self_infect":
      return { t: "self_infect" };
    case "chat":
      return str(o.text) ? { t: "chat", text: o.text } : null;
    case "pm":
      return str(o.text) && str(o.to) ? { t: "pm", to: o.to, text: o.text } : null;
    case "monster":
      return str(o.id) ? { t: "monster", id: o.id } : null;
    case "gun":
      return GUN_ACTIONS.includes(o.action as GunAction) && optStr(o.target)
        ? { t: "gun", action: o.action as GunAction, target: o.target as string | undefined }
        : null;
    case "infect":
      return str(o.target) && optInt(o.bait) && optStr(o.word)
        ? { t: "infect", target: o.target, bait: o.bait as number | undefined, word: o.word as string | undefined }
        : null;
    case "infect_cancel":
      return Number.isInteger(o.id) ? { t: "infect_cancel", id: o.id as number } : null;
    default:
      return null;
  }
}
