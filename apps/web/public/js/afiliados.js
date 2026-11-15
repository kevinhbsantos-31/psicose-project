// Área do afiliado e Pagamentos de Afiliados — PRÉVIA (F0). Regras reais em packages/finance (cópia gerada em js/lib/finance.js).
// shortcut: vendas fictícias geradas no navegador e pagamentos guardados no localStorage; na F4/F5 os dados vêm do Supabase
// e todo cálculo roda no servidor (o navegador nunca é fonte de valores financeiros).
import { db, esc, money, navigate, rerender, toast } from "./app.js";
import { closeDialog, openDialog, refresh } from "./admin.js";
import * as F from "./lib/finance.js";

const S = () => db.get();
const brl = (c) => money(c / 100);
const dt = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");
const sat = (ymd) => new Date(`${ymd}T12:00:00Z`).toLocaleDateString("pt-BR");
const hold = () => S().settings.holdDays ?? 7; // provisório: carência pendente de decisão do proprietário
const DEMO = `<span class="demo">DEMONSTRAÇÃO</span>`;
const STATUS_TAG = { pendente: "", liberada: "ok", paga: "ok", estornada: "red" };

/* ---------- Dados fictícios determinísticos (só para visualizar as telas) ---------- */
const DEMO_AFFS = [
  { id: "demo-1", userId: "u-demo-1", name: "Afiliado fictício 01", code: "PSI7K2QX", status: "ativo" },
  { id: "demo-2", userId: "u-demo-2", name: "Afiliado fictício 02", code: "VHS9M4TR", status: "ativo" },
];
const ITEMS = [["Documento: Ajuda Aqui", 490], ["Coleção: Arquivo completo", 3490], ["Avatar \"Fita gasta\"", 790], ["Insígnia \"Sobrevivente\"", 490], ["Caixa de arquivos", 2490]];
const DAY = 86_400_000;
function demoSales() {
  const n = new Date(), base = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate(), 15);
  return Array.from({ length: 24 }, (_, i) => {
    const aff = DEMO_AFFS[i % 3 === 2 ? 1 : 0], [product, gross] = ITEMS[(i * 7) % ITEMS.length], ago = (i * 37) % 40;
    const created = new Date(base - ago * DAY), discount = i % 6 === 0 ? Math.round(gross * 0.1) : 0;
    const status = ago < 2 ? "pendente" : i % 11 === 5 ? "reembolsada" : "liquidada";
    return { id: `demo-v${i + 1}`, affiliateId: aff.id, buyer: `c${((i * 5) % 9) + 1}`, product, createdAt: created.toISOString(), grossCents: gross,
      discountCents: discount, feeCents: Math.round((gross - discount) * 0.04), otherDeductions: [], status,
      settledAt: status === "pendente" ? undefined : new Date(created.getTime() + 2 * DAY).toISOString() };
  });
}
const affiliates = () => [...DEMO_AFFS, ...S().affiliates.filter((a) => a.code).map((a) => ({ id: `app-${a.id}`, userId: `app-${a.id}`, name: a.name, code: a.code, status: a.status === "aprovado" ? "ativo" : "suspenso" }))];
const affName = (id) => affiliates().find((a) => a.id === id)?.name ?? id;
const payouts = () => (S().affPayouts ??= []);
const referrals = (affId) => {
  const buyers = [...new Set(demoSales().filter((s) => s.affiliateId === affId).map((s) => s.buyer))];
  return [...buyers, ...["n1", "n2", "n3"].map((x) => `${affId}-${x}`)].map((b, i) => ({ id: b, label: `Cliente ***${String(i + 1).padStart(2, "0")}`, joined: new Date(Date.now() - (45 - i * 3) * DAY).toISOString() }));
};
export const referralLink = (code) => `${location.origin}${location.pathname}#/r/${code}`;
export function onAffiliateApproved(a) {
  if (!a.code) a.code = F.referralCode(Math.random); // código gerado uma vez, na aprovação
}

/* ---------- Área do afiliado (#/afiliado) ---------- */
let tab = "painel";
const TABS = [["painel", "Painel"], ["link", "Meu link"], ["indicacoes", "Minhas indicações"], ["vendas", "Minhas vendas"], ["comissoes", "Minhas comissões"], ["pagamentos", "Meus pagamentos"]];
const kpi = (l, v) => `<div class="card kpi"><div class="v">${v}</div><div class="l">${l}</div></div>`;
export function affiliatePage() {
  if (!S().profile) return `<section class="section"><div class="wrap"><h1>Área do afiliado</h1><p>Entre na sua conta para acessar.</p><a class="btn" href="/conta" data-link>Entrar</a></div></section>`;
  const aff = DEMO_AFFS[0], now = new Date(), sales = demoSales().filter((s) => s.affiliateId === aff.id), pays = payouts().filter((p) => p.affiliateId === aff.id);
  const sum = F.affiliateSummary(sales, aff.id, now, hold(), pays), refs = referrals(aff.id), buyers = new Set(sales.map((s) => s.buyer));
  const next = F.payoutSaturday(now), nextCents = F.buildCycle(sales, next, hold(), pays).totalCents;
  const comm = (s) => F.commissionOf(s, now, hold(), pays);
  const body = {
    painel: `<div class="kpis">${kpi("Cadastros pelo seu link", refs.length)}${kpi("Clientes que compraram", buyers.size)}${kpi("Vendas", sum.salesCount)}${kpi("Valor das vendas", brl(sum.paidCents))}
      ${kpi("Valor líquido", brl(sum.netCents))}${kpi("Comissão acumulada", brl(sum.accruedCents))}${kpi("Pendente", brl(sum.pendente))}${kpi("Liberada", brl(sum.liberada))}${kpi("Recebida", brl(sum.paga))}${kpi(`Próximo pagamento (${sat(next)})`, brl(nextCents))}</div>`,
    link: `<div class="card"><label for="ref-link">Seu link exclusivo</label><div class="row" style="flex-wrap:nowrap"><input id="ref-link" readonly value="${esc(referralLink(aff.code))}"><button class="btn small" data-action="copy-ref">Copiar</button></div>
      <p class="small">Código de indicação: <b class="mono">${aff.code}</b></p></div>
      <div class="kpis" style="margin-top:14px">${kpi("Cadastros", refs.length)}${kpi("Vendas geradas", sum.salesCount)}${kpi("Conversão em compradores", `${Math.round((buyers.size / refs.length) * 100)}%`)}</div>`,
    indicacoes: table(["Cliente", "Cadastro", "Situação", "Compras", "Vendas elegíveis", "Comissão gerada"], refs.map((r) => {
      const mine = sales.filter((s) => s.buyer === r.id && s.status !== "reembolsada"), c = mine.reduce((t, s) => t + F.statement(s).commissionCents, 0);
      return [r.label, dt(r.joined), "Ativa", mine.length, brl(mine.reduce((t, s) => t + F.statement(s).paidCents, 0)), brl(c)];
    })),
    vendas: table(["Data", "Produto", "Valor pago", "Deduções", "Líquido", "Comissão 50%", "Situação"], sales.map((s) => {
      const st = F.statement(s), c = comm(s);
      return [dt(s.createdAt), esc(s.product), brl(st.paidCents), brl(st.paidCents - st.netCents), brl(st.netCents), brl(st.commissionCents), `<span class="tag ${STATUS_TAG[c.status]}">${c.status}</span>`];
    }), true),
    comissoes: `<div class="kpis">${["pendente", "liberada", "paga", "estornada"].map((k) => kpi(k[0].toUpperCase() + k.slice(1), brl(sum[k]))).join("")}</div>
      ${table(["Venda", "Valor", "Situação", "Liberação"], sales.map((s) => { const c = comm(s); return [dt(s.createdAt), brl(c.cents), `<span class="tag ${STATUS_TAG[c.status]}">${c.status}</span>`, c.availableAt ? dt(c.availableAt) : "—"]; }), true)}
      <p class="small muted">Pendente: aguardando liquidação ou carência. Liberada: entra no próximo sábado. Paga: transferência confirmada. Estornada: reembolso, cancelamento ou chargeback.</p>`,
    pagamentos: `<p>Próximo sábado de pagamento: <b>${sat(next)}</b> · previsto ${brl(nextCents)}</p>
      ${pays.length ? table(["Pago em", "Sábado de referência", "Valor", "Identificação", "Comprovante"], pays.map((p) => [dt(p.paidAt), sat(p.cycle), brl(p.cents), esc(p.reference), p.receipt ? esc(p.receipt) : "—"])) : '<p class="muted">Nenhum pagamento recebido ainda.</p>'}`,
  }[tab];
  return `<section class="section"><div class="wrap">
    <p class="kicker">Programa de afiliados ${DEMO}</p><h1>Área do afiliado</h1>
    <p class="notice small">Prévia com dados <b>fictícios</b> do "${aff.name}". Com o Supabase do PSICOSE, cada afiliado verá somente os próprios dados, calculados no servidor. Comissão: 50% do valor líquido recebido em cada compra dos seus indicados, para sempre (D-41). Pagamentos aos sábados (D-42).</p>
    <div class="tabs" role="tablist">${TABS.map(([id, l]) => `<button role="tab" aria-selected="${id === tab}" data-action="afftab" data-id="${id}">${l}</button>`).join("")}</div>
    ${body}</div></section>`;
}
function table(cols, rows, newestFirst = false) {
  const r = newestFirst ? [...rows].reverse() : rows;
  return `<div class="table-wrap"><table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${
    r.length ? r.map((row) => `<tr>${row.map((v) => `<td>${v}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${cols.length}" class="muted">Nada registrado.</td></tr>`
  }</tbody></table></div>`;
}

/* ---------- Convite (#/r/CODIGO): guarda o código até o cadastro ---------- */
export function referralPage(code) {
  const a = affiliates().find((x) => x.code === code.toUpperCase() && x.status === "ativo");
  try { if (a) sessionStorage.setItem("psicose.ref", a.code); } catch {}
  return `<section class="section"><div class="wrap auth"><div class="card auth-card">
    <h1 class="auth-title">${a ? "Você foi convidado." : "Convite inválido."}</h1>
    <p>${a ? "Se tem coragem, atravesse a porta. Seu lugar neste mundo está esperando." : "Este link não existe ou foi desativado."}</p>
    <a class="btn" href="/conta/cadastro" data-link>Criar conta</a></div>
    <p class="notice small">${DEMO} Na versão real, o vínculo com quem indicou é gravado no banco no momento do cadastro e nunca muda.</p></div></section>`;
}
/** Chamado ao criar a conta de demonstração: aplica a regra de atribuição vitalícia. */
export function attachReferral(profile) {
  let code = null;
  try { code = sessionStorage.getItem("psicose.ref"); sessionStorage.removeItem("psicose.ref"); } catch {}
  if (!code) return;
  const r = F.attribute({ id: "visitante", createdAt: new Date().toISOString(), referredBy: profile.referredBy ?? null }, code, affiliates());
  if (r.ok) profile.referredBy = r.affiliateId;
}

/* ---------- Painel: Pagamentos de Afiliados ---------- */
let cycleDate = null;
export function payoutsAdmin() {
  const now = new Date(), next = F.payoutSaturday(now);
  cycleDate ??= next;
  const sales = demoSales(), c = F.buildCycle(sales, cycleDate, hold(), payouts());
  const history = [...new Set(payouts().map((p) => p.cycle))].sort().reverse();
  const saturdays = [0, 1, 2, 3].map((k) => F.payoutSaturday(new Date(Date.parse(`${next}T12:00:00Z`) - (k + 1) * 7 * DAY)));
  return `<div class="admin-top"><h1 style="margin:0">Pagamentos de Afiliados</h1>${DEMO}</div>
  <p class="muted small">Comissões liberadas até sexta 23:59 (Brasília) entram no sábado. Carência atual: <b>${hold()} dias</b> (provisória, aguarda decisão). Nada é marcado como pago sem o registro do administrador. Vendas fictícias.</p>
  <div class="row" style="margin-bottom:14px"><label for="cy" style="margin:0">Sábado</label><select id="cy" data-input="cycle" style="max-width:200px">
    ${[next, ...saturdays].map((d) => `<option value="${d}"${d === cycleDate ? " selected" : ""}>${sat(d)}${d === next ? " (próximo)" : ""}</option>`).join("")}</select></div>
  <div class="kpis">${kpi("Total a pagar neste sábado", brl(c.totalCents))}${kpi("Afiliados com valor liberado", c.lines.length)}${kpi("Divergências", c.divergences.length)}</div>
  ${table(["Afiliado", "Vendas", "Valor liberado", ""], c.lines.map((l) => [esc(affName(l.affiliateId)), l.saleIds.length, brl(l.cents),
    `<button class="btn ghost small" data-action="py-detail" data-id="${l.affiliateId}">Demonstrativo</button> <button class="btn small" data-action="py-pay" data-id="${l.affiliateId}">Registrar pagamento</button>`]))}
  ${c.divergences.length ? `<h3 style="margin-top:18px">Divergências</h3><p class="small muted">Comissões já pagas cujas vendas foram estornadas depois. O tratamento (descontar dos próximos pagamentos ou não) aguarda decisão.</p>
    ${table(["Afiliado", "Venda", "Valor"], c.divergences.map((d) => [esc(affName(d.affiliateId)), d.saleId, brl(d.cents)]))}` : ""}
  <h3 style="margin-top:22px">Resumo semanal</h3>
  ${table(["Sábado", "Afiliados pagos", "Total pago", "Ainda pendente", "Não receberam"], history.map((d) => {
    const ps = payouts().filter((p) => p.cycle === d), open = F.buildCycle(sales, d, hold(), payouts());
    return [sat(d), ps.length, brl(ps.reduce((t, p) => t + p.cents, 0)), brl(open.totalCents), open.lines.map((l) => esc(affName(l.affiliateId))).join(", ") || "—"];
  }))}
  <h3 style="margin-top:22px">Pagamentos registrados</h3>
  ${table(["Pago em", "Afiliado", "Sábado", "Valor", "Referência", "Comprovante"], payouts().map((p) => [dt(p.paidAt), esc(affName(p.affiliateId)), sat(p.cycle), brl(p.cents), esc(p.reference), p.receipt ? esc(p.receipt) : "—"]), true)}`;
}
const lineOf = (affId) => F.buildCycle(demoSales(), cycleDate, hold(), payouts()).lines.find((l) => l.affiliateId === affId);

export const affiliateActions = {
  afftab(el) { tab = el.dataset.id; rerender(); },
  "copy-ref"() {
    const v = document.getElementById("ref-link").value;
    navigator.clipboard?.writeText(v).then(() => toast("Link copiado."), () => toast("Copie o link manualmente."));
  },
  "py-detail"(el) {
    const l = lineOf(el.dataset.id), sales = demoSales().filter((s) => l.saleIds.includes(s.id));
    openDialog(`Demonstrativo: ${esc(affName(l.affiliateId))}`, table(["Venda", "Produto", "Pago", "Taxa", "Líquido", "Comissão"], sales.map((s) => {
      const st = F.statement(s);
      return [dt(s.createdAt), esc(s.product), brl(st.paidCents), brl(st.paidCents - st.netCents), brl(st.netCents), brl(st.commissionCents)];
    })) + `<p><b>Total: ${brl(l.cents)}</b> · comissão = 50% do líquido (D-41)</p>`);
  },
  "py-pay"(el) {
    const l = lineOf(el.dataset.id);
    openDialog(`Registrar pagamento: ${esc(affName(l.affiliateId))}`, `<form data-form="payout" class="form-grid"><input type="hidden" name="aff" value="${esc(l.affiliateId)}">
      <div><label for="py-d">Data da transferência</label><input id="py-d" name="date" type="date" required value="${new Date().toISOString().slice(0, 10)}"></div>
      <div><label for="py-v">Valor transferido (R$)</label><input id="py-v" name="value" type="number" min="0.01" step="0.01" required value="${(l.cents / 100).toFixed(2)}"></div>
      <div style="grid-column:1/-1"><label for="py-r">Referência da transferência</label><input id="py-r" name="ref" required maxlength="80" placeholder="ID do PIX ou da transferência"></div>
      <div style="grid-column:1/-1"><label for="py-f">Comprovante (nome do arquivo; o envio real fica para a versão com servidor)</label><input id="py-f" name="receipt" type="file" accept="image/*,application/pdf"></div>
      <p class="small muted" style="grid-column:1/-1">Confirme só depois de a transferência ter sido feita de verdade.</p>
      <div class="row" style="grid-column:1/-1"><button class="btn">Confirmar pagamento realizado</button><button type="button" class="btn ghost" data-action="close">Cancelar</button></div></form>`);
  },
};
export const affiliateForms = {
  payout(f) {
    const l = lineOf(f.elements.aff.value);
    if (!l) return toast("Nada liberado para este afiliado neste sábado.");
    const cents = Math.round(Number(f.elements.value.value) * 100);
    if (cents !== l.cents && !confirm(`O valor informado difere do liberado (${brl(l.cents)}). Registrar mesmo assim como divergência?`)) return;
    payouts().push({ id: `py-${Date.now()}`, affiliateId: l.affiliateId, cycle: cycleDate, saleIds: l.saleIds, cents, paidAt: new Date(`${f.elements.date.value}T12:00:00Z`).toISOString(),
      reference: f.elements.ref.value.trim(), receipt: f.elements.receipt.files?.[0]?.name ?? "" });
    if (db.save()) { closeDialog(); refresh(); toast("Pagamento registrado. As comissões passaram para \"Paga\"."); }
  },
};
export const affiliateInputs = { cycle(el) { cycleDate = el.value; refresh(); } };
