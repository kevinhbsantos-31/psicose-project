// Regras financeiras do PSICOSE (D-41 comissão, D-42 sábado). TS puro, sem I/O: o servidor e a prévia do site usam o mesmo código.
// Dinheiro sempre em centavos inteiros.
export const COMMISSION_RATE = 0.5; // D-41: 50% do líquido efetivamente recebido
// Demonstrativo de uma venda. Arredondamento: meio centavo para cima (pendente de confirmação do proprietário).
export function statement(s) {
    const paidCents = Math.max(0, s.grossCents - s.discountCents);
    const deductions = [{ label: "Taxa do meio de pagamento", cents: s.feeCents }, ...s.otherDeductions];
    const netCents = Math.max(0, paidCents - deductions.reduce((t, d) => t + d.cents, 0));
    const commissionCents = s.affiliateId ? Math.round(netCents * COMMISSION_RATE) : 0;
    return { paidCents, deductions, netCents, commissionCents, platformCents: netCents - commissionCents };
}
const DAY = 86_400_000;
/** Situação da comissão de uma venda. holdDays = carência após a liquidação (decisão pendente do proprietário). */
export function commissionOf(s, now, holdDays, payouts) {
    if (!s.affiliateId)
        return null;
    const { commissionCents } = statement(s);
    const paid = payouts.find((p) => p.saleIds.includes(s.id));
    const base = { saleId: s.id, affiliateId: s.affiliateId, cents: commissionCents };
    // Estorno preserva o histórico: a comissão continua listada, como estornada. Se já tinha sido paga, vira divergência no ciclo.
    if (s.status === "reembolsada" || s.status === "chargeback")
        return { ...base, status: "estornada", availableAt: null, payoutId: paid?.id };
    if (paid)
        return { ...base, status: "paga", availableAt: null, payoutId: paid.id };
    if (s.status !== "liquidada" || !s.settledAt)
        return { ...base, status: "pendente", availableAt: null };
    const availableAt = new Date(Date.parse(s.settledAt) + holdDays * DAY);
    return { ...base, status: availableAt <= now ? "liberada" : "pendente", availableAt: availableAt.toISOString() };
}
// shortcut: fuso de Brasília fixo em UTC-3 (sem horário de verão desde 2019); trocar por Intl/Temporal se voltar o horário de verão.
const BRT = -3 * 3_600_000;
const brt = (d) => new Date(d.getTime() + BRT);
const ymd = (d) => d.toISOString().slice(0, 10);
/** Sábado de pagamento para o qual uma comissão liberada em `at` entra. Corte: sexta 23:59:59 (Brasília). */
export function payoutSaturday(at) {
    const local = brt(at);
    const dow = local.getUTCDay(); // 0 dom … 6 sáb
    const add = dow === 6 ? 7 : 6 - dow; // liberada no sábado → próximo sábado (corte já passou)
    return ymd(new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + add)));
}
/** Fim do corte (sexta 23:59:59 em Brasília) do sábado informado, em UTC. */
export const cycleCutoff = (saturday) => new Date(Date.parse(`${saturday}T00:00:00Z`) - BRT - 1);
/** Monta o ciclo de um sábado: comissões liberadas até o corte, ainda não pagas. Vendas duplicadas contam uma vez. */
export function buildCycle(sales, saturday, holdDays, payouts) {
    const cutoff = cycleCutoff(saturday);
    const unique = [...new Map(sales.map((s) => [s.id, s])).values()];
    const byAff = new Map();
    const divergences = [];
    for (const s of unique) {
        const c = commissionOf(s, cutoff, holdDays, payouts);
        if (!c)
            continue;
        if (c.status === "estornada" && c.payoutId)
            divergences.push(c);
        if (c.status !== "liberada" || c.cents <= 0)
            continue;
        const line = byAff.get(c.affiliateId) ?? { affiliateId: c.affiliateId, cents: 0, saleIds: [] };
        line.cents += c.cents;
        line.saleIds.push(c.saleId);
        byAff.set(c.affiliateId, line);
    }
    const lines = [...byAff.values()].sort((a, b) => b.cents - a.cents);
    return { saturday, lines, totalCents: lines.reduce((t, l) => t + l.cents, 0), divergences };
}
/** Totais por situação para um afiliado (painel e área do afiliado). */
export function affiliateSummary(sales, affiliateId, now, holdDays, payouts) {
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
        if (c)
            t[c.status] += c.cents;
    }
    return { ...t, accruedCents: t.pendente + t.liberada + t.paga };
}
/** Vínculo vitalício: só na criação da conta, uma única vez, nunca pelo próprio afiliado. */
export function attribute(account, code, affiliates) {
    if (account.referredBy)
        return { ok: false, reason: "ja-atribuido" };
    const a = affiliates.find((x) => x.code === code.trim().toUpperCase());
    if (!a)
        return { ok: false, reason: "codigo-invalido" };
    if (a.status !== "ativo")
        return { ok: false, reason: "afiliado-inativo" };
    if (a.userId === account.id)
        return { ok: false, reason: "autoindicacao" };
    return { ok: true, affiliateId: a.id };
}
/** Código de indicação legível (sem 0/O/1/I), gerado na aprovação. */
export function referralCode(rand, length = 8) {
    const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length }, () => abc[Math.floor(rand() * abc.length)]).join("");
}
