// Painel administrativo — PRÉVIA FUNCIONAL. Sem autenticação e sem servidor: nada aqui é seguro para produção.
// shortcut: dados só no localStorage deste navegador; trocar por API autenticada quando o backend do portal existir.
import { PORTAL_MODULES, portalAdminActions, portalAdminForms, portalAdminInputs } from "./portal.js";
import { db, esc, money, MONSTER_FIELDS, monsterArt, navigate, productArt, rerender, SHOP_CATEGORIES, slugify, toast } from "./app.js";

const MODULES = [
  { path: "/admin", label: "Dashboard", view: dashboard },
  { path: "/admin/monstros", label: "Monstros", view: monstersAdmin },
  { path: "/admin/usuarios", label: "Usuários", view: usersAdmin },
  { path: "/admin/produtos", label: "Loja e produtos", view: productsAdmin },
  { path: "/admin/financeiro", label: "Financeiro", view: finance },
  { path: "/admin/conteudo", label: "Conteúdo", view: contentAdmin },
  ...PORTAL_MODULES,
  { path: "/admin/config", label: "Configurações", view: settingsAdmin },
];
let current = MODULES[0];
const S = () => db.get();
export const DEMO = `<span class="demo">DEMONSTRAÇÃO</span>`;
export const nextId = (list) => list.reduce((m, x) => Math.max(m, x.id), 0) + 1;
const catName = (id) => SHOP_CATEGORIES.find((c) => c.id === id)?.name ?? id;

export function renderAdmin(root, path) {
  current = MODULES.find((m) => m.path === path) ?? MODULES[0];
  root.innerHTML = `<div class="admin">
    <aside class="admin-side">
      <a class="brand" href="/" data-link>PSI<span>C</span>OSE</a><span class="demo">PRÉVIA</span>
      <nav aria-label="Painel">${MODULES.map((m) => `<a href="${m.path}" data-link${m === current ? ' aria-current="page"' : ""}>${m.label}</a>`).join("")}</nav>
      <p class="small" style="margin-top:20px"><a href="/" data-link>← Voltar ao site</a></p>
    </aside>
    <main class="admin-main page">
      <div class="notice"><b>Prévia funcional, não é um painel seguro.</b> Sem login e sem servidor: as alterações ficam só neste navegador. Não insira dados reais.</div>
      <div id="admin-view">${current.view()}</div>
    </main>
  </div><dialog id="dlg" aria-labelledby="dlg-title"></dialog>`;
  document.title = `${current.label} · Painel PSICOSE`;
}
export const refresh = () => (document.getElementById("admin-view").innerHTML = current.view());

export function openDialog(title, body) {
  const d = document.getElementById("dlg");
  d.innerHTML = `<div class="row" style="justify-content:space-between;margin-bottom:8px"><h2 id="dlg-title" style="margin:0">${title}</h2>
    <button class="btn ghost small" data-action="close" aria-label="Fechar">✕</button></div>${body}`;
  d.showModal();
}
export const closeDialog = () => document.getElementById("dlg")?.close();

/* ---------- Dados de demonstração (gerados, determinísticos) ---------- */
const STATUS = ["ativo", "ativo", "ativo", "inativo", "suspenso"];
let USERS;
function demoUsers() {
  if (USERS) return USERS;
  const day = 86400000;
  const now = Date.now();
  USERS = Array.from({ length: 36 }, (_, i) => {
    const n = String(i + 1).padStart(3, "0");
    return {
      id: i + 1,
      name: `jogador_${n}`,
      email: `jogador${n}@exemplo.com`,
      status: STATUS[(i * 7) % STATUS.length],
      created: new Date(now - (i * 1.7 + (i % 3)) * day),
      matches: (i * 13) % 41,
      platform: "Android",
    };
  });
  return USERS;
}
const SIGNUPS = [4, 7, 5, 9, 6, 12, 8, 11, 14, 10, 13, 16, 12, 18];
const SALES_BY_CAT = [42, 31, 18, 27, 55, 12];

/* ---------- Gráficos (SVG simples) ---------- */
function barChart(values, labels) {
  const w = 520, h = 180, pad = 24, max = Math.max(...values), bw = (w - pad * 2) / values.length;
  const bars = values
    .map((v, i) => {
      const bh = (v / max) * (h - pad * 2);
      return `<rect x="${pad + i * bw + 3}" y="${h - pad - bh}" width="${bw - 6}" height="${bh}" fill="#7d1414" opacity="${0.55 + (0.45 * v) / max}"><title>${labels[i]}: ${v}</title></rect>
      ${i % 2 === 0 ? `<text x="${pad + i * bw + bw / 2}" y="${h - 6}" text-anchor="middle">${labels[i]}</text>` : ""}`;
    })
    .join("");
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Gráfico de barras demonstrativo"><line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="#2e241b"/>${bars}</svg>`;
}
function hBars(values, labels) {
  const max = Math.max(...values);
  return values
    .map(
      (v, i) => `<div style="margin:8px 0"><div class="row small" style="justify-content:space-between"><span>${esc(labels[i])}</span><span class="mono">${v}</span></div>
      <div style="height:8px;background:#1b140e;border-radius:2px"><div style="height:100%;width:${(v / max) * 100}%;background:#7d1414;border-radius:2px"></div></div></div>`,
    )
    .join("");
}

/* ---------- Dashboard ---------- */
function dashboard() {
  const prods = S().products;
  const users = demoUsers();
  const days = SIGNUPS.map((_, i) => {
    const d = new Date(Date.now() - (SIGNUPS.length - 1 - i) * 86400000);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });
  return `<div class="admin-top"><h1 style="margin:0">Dashboard</h1>${DEMO}</div>
  <div class="kpis">
    <div class="card kpi"><div class="v">1.284</div><div class="l">Usuários ${DEMO}</div></div>
    <div class="card kpi"><div class="v">86</div><div class="l">Cadastros (7 dias) ${DEMO}</div></div>
    <div class="card kpi"><div class="v">${prods.length}</div><div class="l">Produtos cadastrados (${prods.filter((p) => p.visible).length} visíveis)</div></div>
    <div class="card kpi"><div class="v">185</div><div class="l">Vendas ${DEMO}</div></div>
    <div class="card kpi"><div class="v">${money(1873.5)}</div><div class="l">Receita ${DEMO}</div></div>
  </div>
  <div class="panel-grid">
    <div class="card"><h3>Novos cadastros (14 dias) ${DEMO}</h3>${barChart(SIGNUPS, days)}</div>
    <div class="card"><h3>Vendas por categoria ${DEMO}</h3>${hBars(SALES_BY_CAT, SHOP_CATEGORIES.map((c) => c.name))}</div>
    <div class="card"><h3>Cadastros recentes ${DEMO}</h3>
      ${users.slice(0, 5).map((u) => `<div class="list-item"><span>${esc(u.name)}</span><span class="muted small">${u.created.toLocaleDateString("pt-BR")}</span></div>`).join("")}
      <a class="btn ghost small" href="/admin/usuarios" data-link style="margin-top:10px">Ver todos</a></div>
    <div class="card"><h3>Biblioteca de Monstros</h3>
      <p class="muted">${S().monsters.filter((m) => m.published).length} publicados · ${S().monsters.filter((m) => !m.published).length} ocultos · ${S().monsters.filter((m) => MONSTER_FIELDS.some(([k]) => !m[k] && k !== "mainCondition" && k !== "phrase")).length} com ficha incompleta</p>
      <a class="btn ghost small" href="/admin/monstros" data-link>Gerenciar</a></div>
  </div>`;
}

/* ---------- Monstros ---------- */
function monstersAdmin() {
  return `<div class="admin-top"><h1 style="margin:0">Monstros</h1><button class="btn" data-action="m-new">+ Adicionar registro</button></div>
  <div class="card">${S()
    .monsters.map(
      (m) => `<div class="list-item">
      <div class="row" style="flex-wrap:nowrap;min-width:0"><div class="thumb">${monsterArt(m)}</div>
        <div style="min-width:0"><b>${esc(m.name)}</b><div class="small muted">${esc(m.specialty || "Especialidade a definir")}</div></div></div>
      <div class="row" style="gap:6px;justify-content:flex-end">
        <span class="tag ${m.published ? "ok" : "red"}">${m.published ? "Publicado" : "Oculto"}</span>
        <button class="btn ghost small" data-action="m-view" data-id="${m.id}">Visualizar</button>
        <button class="btn ghost small" data-action="m-edit" data-id="${m.id}">Editar</button>
        <button class="btn small" data-action="m-toggle" data-id="${m.id}">${m.published ? "Ocultar" : "Publicar"}</button>
      </div></div>`,
    )
    .join("")}</div>`;
}
function monsterForm(m = {}) {
  return `<form data-form="monster" class="form-grid">
    <input type="hidden" name="id" value="${m.id ?? ""}"><input type="hidden" name="image" value="${esc(m.image ?? "")}">
    <div style="grid-column:1/-1"><label for="f-name">Nome oficial</label><input id="f-name" name="name" required maxlength="80" value="${esc(m.name ?? "")}"></div>
    ${MONSTER_FIELDS.map(([k, label]) => `<div style="grid-column:1/-1"><label for="f-${k}">${label} <span class="small">(vazio = "A definir")</span></label>
      <textarea id="f-${k}" name="${k}" maxlength="2000" style="min-height:64px">${esc(m[k] ?? "")}</textarea></div>`).join("")}
    ${imageField()}
    <label class="check" style="grid-column:1/-1"><input type="checkbox" name="published"${m.published !== false ? " checked" : ""}> Publicado no site</label>
    <div class="row" style="grid-column:1/-1;margin-top:14px"><button class="btn">Salvar</button><button type="button" class="btn ghost" data-action="close">Cancelar</button></div>
  </form>`;
}
export const imageField = () => `<div style="grid-column:1/-1"><label for="f-img">Imagem (JPG/PNG/WebP até 600 KB, salva só neste navegador)</label>
  <input id="f-img" type="file" accept="image/png,image/jpeg,image/webp" data-input="image">
  <button type="button" class="btn ghost small" data-action="clear-image" style="margin-top:6px">Remover imagem</button></div>`;

/* ---------- Usuários ---------- */
let userQ = "", userStatus = "todos";
const userRows = () => {
  const q = userQ.trim().toLowerCase();
  const list = demoUsers().filter((u) => (userStatus === "todos" || u.status === userStatus) && (!q || u.name.includes(q) || u.email.includes(q)));
  if (!list.length) return `<tr><td colspan="6" class="muted">Nenhum usuário encontrado.</td></tr>`;
  return list
    .map(
      (u) => `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td><span class="tag ${u.status === "ativo" ? "ok" : u.status === "suspenso" ? "red" : ""}">${u.status}</span></td>
      <td>${u.created.toLocaleDateString("pt-BR")}</td><td>${u.matches}</td><td>${u.platform}</td></tr>`,
    )
    .join("");
};
function usersAdmin() {
  return `<div class="admin-top"><h1 style="margin:0">Usuários</h1>${DEMO}</div>
  <p class="muted small">Lista fictícia para testar a interface. Os usuários reais virão do Supabase Auth do PSICOSE, quando integrado.</p>
  <div class="form-grid" style="margin-bottom:14px">
    <div><label for="u-q">Buscar</label><input id="u-q" type="search" placeholder="Nome ou e-mail" value="${esc(userQ)}" data-input="userq"></div>
    <div><label for="u-s">Status</label><select id="u-s" data-input="userstatus">${["todos", "ativo", "inativo", "suspenso"].map((s) => `<option${s === userStatus ? " selected" : ""}>${s}</option>`).join("")}</select></div>
  </div>
  <div class="table-wrap"><table><thead><tr><th>Usuário</th><th>E-mail</th><th>Status</th><th>Cadastro</th><th>Partidas</th><th>Plataforma</th></tr></thead>
  <tbody id="users-body">${userRows()}</tbody></table></div>`;
}

/* ---------- Produtos ---------- */
let prodCat = "todas";
function productsAdmin() {
  const list = S().products.filter((p) => prodCat === "todas" || p.category === prodCat);
  return `<div class="admin-top"><h1 style="margin:0">Loja e produtos</h1><button class="btn" data-action="p-new">+ Cadastrar produto</button></div>
  <p class="muted small">Preços demonstrativos. Nenhum pagamento está habilitado. Somente itens cosméticos (sem vantagem em jogo).</p>
  <div style="max-width:320px;margin-bottom:14px"><label for="p-cat">Categoria</label><select id="p-cat" data-input="prodcat">
    ${[{ id: "todas", name: "Todas" }, ...SHOP_CATEGORIES].map((c) => `<option value="${c.id}"${c.id === prodCat ? " selected" : ""}>${c.name}</option>`).join("")}</select></div>
  <div class="card">${
    list.length
      ? list
          .map(
            (p) => `<div class="list-item">
      <div class="row" style="flex-wrap:nowrap;min-width:0"><div class="thumb" style="height:44px">${productArt(p)}</div>
        <div style="min-width:0"><b>${esc(p.name)}</b><div class="small muted">${esc(catName(p.category))} · ${money(p.price)}</div></div></div>
      <div class="row" style="gap:6px;justify-content:flex-end">
        <span class="tag ${p.visible ? "ok" : "red"}">${p.visible ? "Visível" : "Oculto"}</span>
        <button class="btn ghost small" data-action="p-up" data-id="${p.id}" aria-label="Subir ${esc(p.name)}">↑</button>
        <button class="btn ghost small" data-action="p-down" data-id="${p.id}" aria-label="Descer ${esc(p.name)}">↓</button>
        <button class="btn ghost small" data-action="p-edit" data-id="${p.id}">Editar</button>
        <button class="btn small" data-action="p-toggle" data-id="${p.id}">${p.visible ? "Ocultar" : "Exibir"}</button>
      </div></div>`,
          )
          .join("")
      : `<p class="muted">Nenhum produto nesta categoria.</p>`
  }</div>`;
}
function productForm(p = {}) {
  return `<form data-form="product" class="form-grid">
    <input type="hidden" name="id" value="${p.id ?? ""}"><input type="hidden" name="image" value="${esc(p.image ?? "")}">
    <div><label for="f-pn">Nome</label><input id="f-pn" name="name" required maxlength="80" value="${esc(p.name ?? "")}"></div>
    <div><label for="f-pc">Categoria</label><select id="f-pc" name="category">${SHOP_CATEGORIES.map((c) => `<option value="${c.id}"${c.id === p.category ? " selected" : ""}>${c.name}</option>`).join("")}</select></div>
    <div style="grid-column:1/-1"><label for="f-pd">Descrição</label><textarea id="f-pd" name="description" maxlength="600">${esc(p.description ?? "")}</textarea></div>
    <div><label for="f-pp">Preço demonstrativo (R$)</label><input id="f-pp" name="price" type="number" min="0" step="0.01" required value="${p.price ?? ""}"></div>
    ${imageField()}
    <label class="check" style="grid-column:1/-1"><input type="checkbox" name="visible"${p.visible !== false ? " checked" : ""}> Visível na loja</label>
    <div class="row" style="grid-column:1/-1;margin-top:14px"><button class="btn">Salvar</button><button type="button" class="btn ghost" data-action="close">Cancelar</button></div>
  </form>`;
}

/* ---------- Financeiro ---------- */
function finance() {
  const empty = (cols, msg) => `<div class="table-wrap"><table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
    <tbody><tr><td colspan="${cols.length}" class="muted">${msg}</td></tr></tbody></table></div>`;
  const kpi = (l) => `<div class="card kpi"><div class="v">—</div><div class="l">${l}</div></div>`;
  return `<div class="admin-top"><h1 style="margin:0">Financeiro</h1><span class="tag red">Pagamentos não integrados</span></div>
  <p class="notice">Interface preparada. Ainda não existe processamento de pagamentos (pendência PT-09), por isso <b>não há valores aqui</b>. Nada nesta tela representa faturamento.</p>
  <div class="kpis">${kpi("Vendas")}${kpi("Receita bruta")}${kpi("Taxas")}${kpi("Reembolsos")}${kpi("Pagamentos pendentes")}</div>
  <div class="row" style="margin-bottom:16px">
    <select style="max-width:220px" aria-label="Período"><option>Últimos 30 dias</option><option>Este mês</option><option>Este ano</option></select>
    <button class="btn ghost" data-action="unavailable">Gerar relatório</button><button class="btn ghost" data-action="unavailable">Exportar CSV</button>
  </div>
  <div class="panel-grid">
    <div><h3>Vendas</h3>${empty(["Data", "Produto", "Valor", "Status"], "Nenhuma venda registrada.")}</div>
    <div><h3>Reembolsos</h3>${empty(["Data", "Pedido", "Valor", "Motivo"], "Nenhum reembolso.")}</div>
    <div><h3>Pagamentos pendentes</h3>${empty(["Pedido", "Valor", "Desde"], "Nenhum pagamento pendente.")}</div>
  </div>`;
}

/* ---------- Conteúdo ---------- */
const CONTENT_FIELDS = [
  ["heroTagline", "Início: frase da capa", 160],
  ["heroIntro", "Início: texto de apresentação", 600],
  ["aboutPremise", "Sobre o jogo: premissa", 1200],
  ["aboutObjective", "Sobre o jogo: objetivo", 1200],
  ["aboutMultiplayer", "Sobre o jogo: experiência multiplayer", 1200],
  ["studio", "Rodapé: sobre o PSICOSE", 400],
  ["affiliate", "Seja um afiliado: apresentação", 1200],
  ["terms", "Termos de uso (aguarda revisão jurídica)", 20000],
  ["privacy", "Política de privacidade (aguarda revisão jurídica)", 20000],
];
function contentAdmin() {
  const c = S().content;
  return `<div class="admin-top"><h1 style="margin:0">Conteúdo</h1></div>
  <p class="muted small">Textos demonstrativos das páginas públicas. As regras e dicas seguem o documento oficial de game design e não são editáveis aqui.</p>
  <form data-form="content" class="card">
    ${CONTENT_FIELDS.map(([k, l, max]) => `<label for="c-${k}">${l}</label><textarea id="c-${k}" name="${k}" maxlength="${max}">${esc(c[k])}</textarea>`).join("")}
    <div class="row" style="margin-top:14px"><button class="btn">Salvar textos</button><a class="btn ghost" href="/" data-link>Ver o site</a></div>
  </form>`;
}

/* ---------- Configurações ---------- */
function settingsAdmin() {
  const s = S().settings;
  return `<div class="admin-top"><h1 style="margin:0">Configurações</h1></div>
  <form data-form="settings" class="card">
    <div class="form-grid">
      <div><label for="s-name">Nome do portal</label><input id="s-name" name="siteName" required maxlength="40" value="${esc(s.siteName)}"></div>
      <div><label for="s-mail">E-mail de contato (exibição futura)</label><input id="s-mail" name="contactEmail" type="email" maxlength="120" value="${esc(s.contactEmail)}" placeholder="contato@exemplo.com"></div>
    </div>
    <label class="check" style="margin-top:16px"><input type="checkbox" name="showShop"${s.showShop ? " checked" : ""}> Exibir a Loja no menu</label>
    <label class="check"><input type="checkbox" name="effects"${s.effects ? " checked" : ""}> Efeitos de granulação e linhas de VHS</label>
    <label class="check"><input type="checkbox" name="maintenance"${s.maintenance ? " checked" : ""}> Mostrar aviso de manutenção no site</label>
    <label for="s-mt">Texto do aviso</label><input id="s-mt" name="maintenanceText" maxlength="160" value="${esc(s.maintenanceText)}">
    <div class="row" style="margin-top:14px"><button class="btn">Salvar configurações</button></div>
  </form>
  <div class="card" style="margin-top:16px;border-color:#7d1414"><h3>Dados da demonstração</h3>
    <p class="muted small">Apaga monstros, produtos, textos e configurações editados neste navegador e volta ao conteúdo inicial.</p>
    <button class="btn" data-action="reset">Restaurar dados de demonstração</button></div>`;
}

/* ---------- Ações, formulários e campos ---------- */
const findM = (el) => S().monsters.find((m) => m.id === Number(el.dataset.id));
const findP = (el) => S().products.find((p) => p.id === Number(el.dataset.id));
function moveProduct(el, dir) {
  const list = S().products;
  const p = findP(el);
  const same = list.filter((x) => prodCat === "todas" || x.category === prodCat);
  const other = same[same.indexOf(p) + dir];
  if (!other) return;
  const a = list.indexOf(p), b = list.indexOf(other);
  [list[a], list[b]] = [list[b], list[a]];
  db.save();
  refresh();
}

export const adminActions = {
  ...portalAdminActions,
  close: closeDialog,
  unavailable: () => toast("Indisponível na prévia: depende da integração de pagamentos."),
  "m-new": () => openDialog("Novo registro", monsterForm()),
  "m-edit": (el) => openDialog("Editar registro", monsterForm(findM(el))),
  "m-view": (el) => {
    const m = findM(el);
    openDialog(esc(m.name), `<div class="dossier"><div class="monster-img">${monsterArt(m)}</div><div>
      ${MONSTER_FIELDS.map(([k, label]) => `<p class="kicker" style="margin:10px 0 2px">${label}</p><p class="${m[k] ? "" : "muted"}">${m[k] ? esc(m[k]) : "A definir"}</p>`).join("")}
      ${m.published ? `<button class="btn ghost small" data-action="m-open" data-id="${m.id}">Abrir no site</button>` : `<span class="tag red">Oculto no site</span>`}</div></div>`);
  },
  "m-open": (el) => {
    closeDialog();
    navigate(`/monstros/${findM(el).slug}`);
  },
  "m-toggle": (el) => {
    const m = findM(el);
    m.published = !m.published;
    db.save();
    refresh();
    toast(m.published ? `"${m.name}" publicado.` : `"${m.name}" oculto do site.`);
  },
  "p-new": () => openDialog("Novo produto", productForm({ category: prodCat === "todas" ? "skins" : prodCat })),
  "p-edit": (el) => openDialog("Editar produto", productForm(findP(el))),
  "p-toggle": (el) => {
    const p = findP(el);
    p.visible = !p.visible;
    db.save();
    refresh();
  },
  "p-up": (el) => moveProduct(el, -1),
  "p-down": (el) => moveProduct(el, 1),
  "clear-image": (el) => {
    const f = el.closest("form");
    f.image.value = "";
    f.querySelector('input[type="file"]').value = "";
    toast("Imagem removida. Salve para aplicar.");
  },
  reset: () => {
    if (!confirm("Restaurar todos os dados de demonstração deste navegador?")) return;
    db.reset();
    rerender();
    toast("Dados de demonstração restaurados.");
  },
};

const text = (f, k) => f[k].value.trim();
export const adminForms = {
  ...portalAdminForms,
  monster(f) {
    const list = S().monsters;
    const id = Number(f.id.value) || nextId(list);
    const name = text(f, "name");
    let slug = slugify(name) || `monstro-${id}`;
    if (list.some((m) => m.slug === slug && m.id !== id)) slug = `${slug}-${id}`;
    const data = {
      id, slug, name, image: f.image.value, published: f.published.checked,
      ...Object.fromEntries(MONSTER_FIELDS.map(([k]) => [k, text(f, k)])),
    };
    const i = list.findIndex((m) => m.id === id);
    if (i >= 0) list[i] = data; else list.push(data);
    if (db.save()) {
      closeDialog();
      refresh();
      toast("Registro salvo.");
    }
  },
  product(f) {
    const list = S().products;
    const price = Number(f.price.value);
    if (!(price >= 0)) return toast("Informe um preço válido.");
    const id = Number(f.id.value) || nextId(list);
    const data = { id, name: text(f, "name"), category: f.category.value, description: text(f, "description"), price, image: f.image.value, visible: f.visible.checked };
    const i = list.findIndex((p) => p.id === id);
    if (i >= 0) list[i] = data; else list.push(data);
    if (db.save()) {
      closeDialog();
      refresh();
      toast("Produto salvo.");
    }
  },
  content(f) {
    for (const [k] of CONTENT_FIELDS) S().content[k] = text(f, k);
    if (db.save()) toast("Textos salvos. Abra o site para conferir.");
  },
  settings(f) {
    Object.assign(S().settings, {
      siteName: text(f, "siteName") || "PSICOSE",
      contactEmail: text(f, "contactEmail"),
      showShop: f.showShop.checked,
      effects: f.effects.checked,
      maintenance: f.maintenance.checked,
      maintenanceText: text(f, "maintenanceText"),
    });
    if (db.save()) {
      rerender();
      toast("Configurações salvas.");
    }
  },
};

export const adminInputs = {
  ...portalAdminInputs,
  userq(el) {
    userQ = el.value;
    document.getElementById("users-body").innerHTML = userRows();
  },
  userstatus(el) {
    userStatus = el.value;
    document.getElementById("users-body").innerHTML = userRows();
  },
  prodcat(el) {
    prodCat = el.value;
    refresh();
  },
  image(el) {
    const file = el.files?.[0];
    if (!file) return;
    if (file.size > 600 * 1024) {
      el.value = "";
      return toast("Imagem acima de 600 KB. Escolha um arquivo menor.");
    }
    const r = new FileReader();
    r.onload = () => {
      el.form.image.value = r.result;
      toast("Imagem carregada. Salve para aplicar.");
    };
    r.readAsDataURL(file);
  },
};
