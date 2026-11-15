// Regras financeiras do PSICOSE (D-41 comissão, D-42 sábado). TS puro, sem I/O: o servidor e a prévia do site usam o mesmo código.
// Dinheiro sempre em centavos inteiros.

export const COMMISSION_RATE = 0.5; // D-41: 50% do líquido efetivamente recebido

export type SaleStatus = "pendente" | "liquidada" | "reembolsada" | "chargeback";
export interface Deduction { label: string; cents: number }
export interface Sale {
  id: string;
  affiliateId: string | null; // gravado do vínculo permanente do cliente no momento da venda
  product: string;
  createdAt: string; // ISO
  grossCents: number; // preço de tabela
  discountCents: number; // cupom/oferta: comissão incide sobre o que foi pago
  feeCents: number; // taxa do meio de pagamento
  otherDeductions: Deduction[]; // só deduções diretamente ligadas à venda e aprovadas (pendência: impostos)
  status: SaleStatus;
  settledAt?: string; // liquidação pelo meio de pagamento
  reversedAt?: string; // reembolso/chargeback
}

export interface Statement {
  paidCents: number;
  deductions: Deduction[];
  netCents: number;
  commissionCents: number;
  platformCents: number;
}

// Demonstrativo de uma venda. Arredondamento: meio centavo para cima (pendente de confirmação do proprietário).
export function statement(s: Sale): Statement {
  const paidCents = Math.max(0, s.grossCents - s.discountCents);
  const deductions = [{ label: "Taxa do meio de pagamento", cents: s.feeCents }, ...s.otherDeductions];
  const netCents = Math.max(0, paidCents - deductions.reduce((t, d) => t + d.cents, 0));
  const commissionCents = s.affiliateId ? Math.round(netCents * COMMISSION_RATE) : 0;
  return { paidCents, deductions, netCents, commissionCents, platformCents: netCents - commissionCents };
}

export type CommissionStatus = "pendente" | "liberada" | "paga" | "estornada";
export interface Commission {
  saleId: string;
  affiliateId: string;
  cents: number;
  status: CommissionStatus;
  availableAt: string | null; // quando fica liberada (liquidação + carência)
  payoutId?: string;
}
export interface Payout {
  id: string;
  affiliateId: string;
  cycle: string; // sábado (AAAA-MM-DD)
  saleIds: string[];
  cents: number;
  paidAt: string; // só existe depois de confirmação real do administrador
  reference: string;
  receipt?: string;
}

const DAY = 86_400_000;

/** Situação da comissão de uma venda. holdDays = carência após a liquidação (decisão pendente do proprietário). */
export function commissionOf(s: Sale, now: Date, holdDays: number, payouts: readonly Payout[]): Commission | null {
  if (!s.affiliateId) return null;
  const { commissionCents } = statement(s);
  const paid = payouts.find((p) => p.saleIds.includes(s.id));
  const base = { saleId: s.id, affiliateId: s.affiliateId, cents: commissionCents };
  // Estorno preserva o histórico: a comissão continua listada, como estornada. Se já tinha sido paga, vira divergência no ciclo.
  if (s.status === "reembolsada" || s.status === "chargeback") return { ...base, status: "estornada", availableAt: null, payoutId: paid?.id };
  if (paid) return { ...base, status: "paga", availableAt: null, payoutId: paid.id };
  if (s.status !== "liquidada" || !s.settledAt) return { ...base, status: "pendente", availableAt: null };
  const availableAt = new Date(Date.parse(s.settledAt) + holdDays * DAY);
  return { ...base, status: availableAt <= now ? "liberada" : "pendente", availableAt: availableAt.toISOString() };
}

// shortcut: fuso de Brasília fixo em UTC-3 (sem horário de verão desde 2019); trocar por Intl/Temporal se voltar o horário de verão.
const BRT = -3 * 3_600_000;
const brt = (d: Date) => new Date(d.getTime() + BRT);
const ymd = (d: Date) => d.toISOString().slice(0, 10);

/** Sábado de pagamento para o qual uma comissão liberada em `at` entra. Corte: sexta 23:59:59 (Brasília). */
export function payoutSaturday(at: Date): string {
  const local = brt(at);
  const dow = local.getUTCDay(); // 0 dom … 6 sáb
  const add = dow === 6 ? 7 : 6 - dow; // liberada no sábado → próximo sábado (corte já passou)
  return ymd(new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + add)));
}
/** Fim do corte (sexta 23:59:59 em Brasília) do sábado informado, em UTC. */
export const cycleCutoff = (saturday: string) => new Date(Date.parse(`${saturday}T00:00:00Z`) - BRT - 1);

export interface CycleLine { affiliateId: string; cents: number; saleIds: string[] }
export interface Cycle {
  saturday: string;
  lines: CycleLine[]; // a pagar por afiliado
  totalCents: number;
  divergences: Commission[]; // pagas e depois estornadas: tratamento pendente de decisão (não descontadas automaticamente)
}

/** Monta o ciclo de um sábado: comissões liberadas até o corte, ainda não pagas. Vendas duplicadas contam uma vez. */
export function buildCycle(sales: readonly Sale[], saturday: string, holdDays: number, payouts: readonly Payout[]): Cycle {
  const cutoff = cycleCutoff(saturday);
  const unique = [...new Map(sales.map((s) => [s.id, s])).values()];
  const byAff = new Map<string, CycleLine>();
  const divergences: Commission[] = [];
  for (const s of unique) {
    const c = commissionOf(s, cutoff, holdDays, payouts);
    if (!c) continue;
    if (c.status === "estornada" && c.payoutId) divergences.push(c);
    if (c.status !== "liberada" || c.cents <= 0) continue;
    const line = byAff.get(c.affiliateId) ?? { affiliateId: c.affiliateId, cents: 0, saleIds: [] };
    line.cents += c.cents;
    line.saleIds.push(c.saleId);
    byAff.set(c.affiliateId, line);
  }
  const lines = [...byAff.values()].sort((a, b) => b.cents - a.cents);
  return { saturday, lines, totalCents: lines.reduce((t, l) => t + l.cents, 0), divergences };
}

/** Totais por situação para um afiliado (painel e área do afiliado). */
export function affiliateSummary(sales: readonly Sale[], affiliateId: string, now: Date, holdDays: number, payouts: readonly Payout[]) {
  const mine = sales.filter((s) => s.affiliateId === affiliateId);
  const t = { salesCount: 0, paidCents: 0, netCents: 0, pendente: 0, liberada: 0, paga: 0, estornada: 0 };
  for (const s of mine) {
    const st = statement(s);
    const c = commissionOf(s, now, holdDays, payouts);
    if (s.status !== "reembolsada" && s.status !== "chargeback") {
      t.salesCount++;
      t.paidCents += st.paidCents;
      t.netCents += st.netCents;
    }
    if (c) t[c.status] += c.cents;
  }
  return { ...t, accruedCents: t.pendente + t.liberada + t.paga };
}

export interface Account { id: string; createdAt: string; referredBy: string | null }
export interface Affiliate { id: string; userId: string; code: string; status: "ativo" | "suspenso" | "encerrado" }
export type AttributionResult = { ok: true; affiliateId: string } | { ok: false; reason: "ja-atribuido" | "codigo-invalido" | "afiliado-inativo" | "autoindicacao" };

/** Vínculo vitalício: só na criação da conta, uma única vez, nunca pelo próprio afiliado. */
export function attribute(account: Account, code: string, affiliates: readonly Affiliate[]): AttributionResult {
  if (account.referredBy) return { ok: false, reason: "ja-atribuido" };
  const a = affiliates.find((x) => x.code === code.trim().toUpperCase());
  if (!a) return { ok: false, reason: "codigo-invalido" };
  if (a.status !== "ativo") return { ok: false, reason: "afiliado-inativo" };
  if (a.userId === account.id) return { ok: false, reason: "autoindicacao" };
  return { ok: true, affiliateId: a.id };
}

/** Código de indicação legível (sem 0/O/1/I), gerado na aprovação. */
export function referralCode(rand: () => number, length = 8): string {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => abc[Math.floor(rand() * abc.length)]).join("");
}
