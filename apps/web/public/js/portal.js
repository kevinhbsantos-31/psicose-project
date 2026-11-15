// Áreas da expansão do portal: som, rodapé institucional, conta, loja (Monstros/Guias), rankings e módulos do painel.
// shortcut: tudo no localStorage deste navegador (prévia). A conta só demonstra o fluxo aprovado (D-24: código por e-mail
// via Supabase Auth, sem senha); trocar pela integração real quando o projeto Supabase do PSICOSE existir (PT-10).
import { db, esc, money, monsterArt, navigate, rerender, toast } from "./app.js";
import { affiliateActions, affiliateForms, affiliateInputs, affiliatePage as affiliateAreaPage, attachReferral, onAffiliateApproved, payoutsAdmin, referralPage } from "./afiliados.js";
import { ARCHIVE_DOCS, DOC_TYPES } from "./arquivo.js";
import { closeDialog, DEMO, imageField, nextId, openDialog, refresh } from "./admin.js";

const S = () => db.get();
const DEMO_NOTE = `<span class="demo">DEMONSTRAÇÃO</span>`;

/* ============ Dados iniciais (mesclados em seed() do app.js) ============ */
// Documentos à venda e coleções. Coleção com all=true inclui todos os documentos, atuais e futuros.
const docPrice = 4.9;
// Critérios PROPOSTOS (aguardam aprovação: PGD-11). Só usam eventos que o servidor já registra.
const RANKING_CATS = [
  { id: "melhor-monstro", name: "Melhor Monstro", criterion: "Taxa de vitória jogando como Monstro (vitórias ÷ partidas como Monstro).", tie: "Mais vitórias como Monstro.", min: 5 },
  { id: "melhor-detetive", name: "Melhor Detetive", criterion: "Pontos de detecção: +3 por disparo seu que eliminou o Monstro, +1 por autorizar um disparo que eliminou o Monstro, −2 por disparo seu que eliminou um Inocente.", tie: "Menos disparos em Inocentes.", min: 5 },
  { id: "monstros-eliminados", name: "Monstros identificados e eliminados", criterion: "Total de Monstros eliminados por disparos feitos pelo jogador. A identificação só conta quando termina em eliminação: o jogo não registra acusações formais.", tie: "Menos partidas jogadas.", min: 1 },
  { id: "inocente", name: "Melhor desempenho como Inocente", criterion: "Taxa de vitória jogando como Inocente (vitórias ÷ partidas como Inocente).", tie: "Mais vitórias como Inocente.", min: 5 },
  { id: "desempenho-monstro", name: "Melhor desempenho como Monstro", criterion: "Média de infecções válidas por partida como Monstro.", tie: "Taxa de vitória como Monstro.", min: 5 },
];
const PROVISIONAL = (what) => `Texto provisório. ${what} oficiais ainda não foram redigidos e dependem de revisão jurídica do proprietário antes da publicação.`;
export function seedExtra() {
  return {
    store: [], // por Monstro: { monsterId, monsterPrice, available }; criado sob demanda
    documents: ARCHIVE_DOCS.map((d) => ({ ...d, price: docPrice, visible: true })),
    collections: [{ id: 1, name: "Arquivo completo dos Monstros", description: "Todos os documentos do Arquivo, inclusive os que forem publicados depois.", all: true, docIds: [], price: 34.9, visible: true }],
    partners: [],
    affiliates: [],
    rankingCats: RANKING_CATS.map((c) => ({ ...c, visible: true })),
    profile: null, // sessão de demonstração: { name, avatar, joined, unlocked: [], docs: [], preferred: "random" } — sem e-mail nem senha
    content: {
      studio: "PSICOSE é um projeto independente em desenvolvimento. O primeiro beta é privado, para Android, com grupos de 4 jogadores.",
      affiliate: "Criadores de conteúdo e comunidades podem se candidatar ao programa de afiliados. As condições do programa ainda não foram definidas.",
      terms: PROVISIONAL("Os termos de uso"),
      privacy: PROVISIONAL("A política de privacidade e as regras de tratamento de dados"),
    },
    settings: { rankingDemo: true },
  };
}
const X = () => S().content;
const SX = () => S().settings;
function storeOf(m) {
  let e = S().store.find((x) => x.monsterId === m.id);
  if (!e) {
    e = { monsterId: m.id, monsterPrice: 9.9, available: true };
    S().store.push(e);
  }
  return e;
}
const pubMonsters = () => S().monsters.filter((m) => m.published);
function me() {
  const p = S().profile;
  if (p) {
    // Migração: guias comprados (versão anterior) viram os documentos do mesmo Monstro.
    p.docs ??= S().documents.filter((d) => (p.guides ?? []).includes(d.monsterId)).map((d) => d.id);
    p.unlocked ??= [];
    p.preferred ??= "random";
  }
  return p;
}
const visDocs = () => S().documents.filter((d) => d.visible);
const docsOf = (c) => (c.all ? visDocs() : visDocs().filter((d) => c.docIds.includes(d.id)));
const monsterOf = (d) => S().monsters.find((m) => m.id === d.monsterId);
const owns = (d) => !!me()?.docs.includes(d.id);
const docCard = (d) => `<a class="card doc-card" href="/arquivo/${d.id}" data-link>
  <span class="tag">${esc(DOC_TYPES[d.type] ?? d.type)}</span><h3>${esc(d.title)}</h3>
  <p class="small muted" style="margin:0 0 8px">${esc(monsterOf(d)?.name ?? "")} · ${esc(d.author)}, ${esc(d.date)}</p>
  <div class="small">${owns(d) ? '<span class="tag ok">Na sua biblioteca</span>' : money(d.price)}</div></a>`;

/* ============ Trilha ambiente (D-32/D-33: arquivo provisório CC0 sintetizado) ============ */
const SOUND_KEY = "psicose.som";
let snd = { on: false, volume: 0.3 };
try { snd = { ...snd, ...JSON.parse(localStorage.getItem(SOUND_KEY) || "{}") }; } catch {}
let audio;
const player = () => {
  if (!audio) {
    audio = new Audio("audio/ambiente.m4a");
    audio.loop = true;
  }
  audio.volume = snd.volume;
  return audio;
};
const saveSnd = () => { try { localStorage.setItem(SOUND_KEY, JSON.stringify(snd)); } catch {} };
const play = () => snd.on && player().play().catch(() => {});
// Nunca toca sozinha: só após um clique/tecla do usuário (mesmo que ele tenha deixado o som ligado na visita anterior).
["pointerdown", "keydown"].forEach((t) => document.addEventListener(t, play, { once: true }));
document.addEventListener("visibilitychange", () => (document.hidden ? audio?.pause() : play()));
export const soundControl = () => `<div class="sound">
  <button class="sound-btn" data-action="sound" aria-pressed="${snd.on}" title="Trilha ambiente">${snd.on ? "♪ Som ligado" : "♪ Som desligado"}</button>
  <input type="range" min="0" max="1" step="0.05" value="${snd.volume}" data-input="volume" aria-label="Volume da trilha ambiente"></div>`;

/* ============ Avatares (gerados, sem imagens externas) ============ */
const TONES = ["#3d2d20", "#2a1f16", "#64492f", "#4a2020", "#2f2a24", "#5a4634"];
export const avatar = (i = 0, size = 44) => `<svg class="avatar" width="${size}" height="${size}" viewBox="0 0 40 40" role="img" aria-label="Avatar ${i + 1}">
  <rect width="40" height="40" rx="20" fill="${TONES[i % TONES.length]}"/><ellipse cx="20" cy="16" rx="6" ry="7.5" fill="#120d09"/>
  <path d="M8 40C9 29 14 25 20 25S31 29 32 40Z" fill="#120d09"/><circle cx="${17 + (i % 3)}" cy="16" r=".9" fill="#ebe0cb"/><circle cx="${23 - (i % 2)}" cy="16" r=".9" fill="#ebe0cb"/></svg>`;

/* ============ Rodapé institucional ============ */
export function footer() {
  const s = S().settings;
  const partners = S().partners.filter((p) => p.visible);
  return `<footer class="site-footer"><div class="wrap footer-grid">
    <div><a class="brand" href="/" data-link>${esc(s.siteName)}</a><p class="small muted">${esc(X().studio)}</p></div>
    <nav aria-label="Institucional"><h4>Institucional</h4>
      <a href="/sobre" data-link>Sobre o PSICOSE</a><a href="/afiliados" data-link>Seja um afiliado</a><a href="/afiliado" data-link>Área do afiliado</a><a href="/parceiros" data-link>Parceiros</a>
      <a href="/contato" data-link>Contato</a><a href="/termos" data-link>Termos de uso</a><a href="/privacidade" data-link>Política de privacidade</a></nav>
    <div><h4>Parceiros</h4>${
      partners.length
        ? `<div class="partner-logos">${partners.map((p) => `<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" title="${esc(p.name)}">${p.logo ? `<img src="${esc(p.logo)}" alt="${esc(p.name)}">` : esc(p.name)}</a>`).join("")}</div>`
        : `<p class="small muted">Nenhum parceiro publicado.</p>`
    }</div>
  </div><div class="wrap footer-base"><span>© ${new Date().getFullYear()} ${esc(s.siteName)} · Prévia do portal. Conteúdo provisório.</span><a href="/admin" data-link>Painel (prévia)</a></div></footer>`;
}

/* ============ Páginas institucionais ============ */
const page = (kicker, title, body) => `<section class="section"><div class="wrap"><p class="kicker">${kicker}</p><h1>${title}</h1>${body}</div></section>`;
const textBlock = (t) => `<div class="paper" style="max-width:48rem">${esc(t).split(/\n+/).map((p) => `<p>${p}</p>`).join("")}</div>`;

function partnersPage() {
  const list = S().partners.filter((p) => p.visible);
  return page("Rede", "Parceiros", list.length
    ? `<div class="grid" style="margin-top:20px">${list.map((p) => `<div class="card">
        ${p.logo ? `<div class="partner-logo"><img src="${esc(p.logo)}" alt="Logotipo de ${esc(p.name)}"></div>` : ""}
        <h3>${esc(p.name)}</h3><p class="muted small">${esc(p.description)}</p>
        <a class="btn ghost small" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Visitar ↗</a></div>`).join("")}</div>`
    : `<p class="muted">Nenhum parceiro publicado ainda.</p>`);
}
function affiliatePage() {
  return page("Programa", "Seja um afiliado", `${textBlock(X().affiliate)}
    <form data-form="affiliate" class="card form-grid" style="max-width:48rem;margin-top:20px">
      <p class="notice" style="grid-column:1/-1;margin:0">${DEMO_NOTE} O pedido fica só neste navegador e não é enviado a ninguém. Não insira dados reais.</p>
      <div><label for="a-name">Nome ou canal</label><input id="a-name" name="name" required maxlength="80"></div>
      <div><label for="a-url">Link do canal (https://)</label><input id="a-url" name="url" type="url" required maxlength="200" placeholder="https://"></div>
      <div style="grid-column:1/-1"><label for="a-about">Sobre o seu público</label><textarea id="a-about" name="about" maxlength="600"></textarea></div>
      <div style="grid-column:1/-1"><button class="btn">Enviar candidatura</button></div>
    </form>`);
}
function contactPage() {
  const mail = S().settings.contactEmail;
  return page("Fale com a gente", "Contato", mail
    ? `<p>Escreva para <a href="mailto:${esc(mail)}">${esc(mail)}</a>.</p>`
    : `<p class="muted">O canal oficial de contato ainda não foi definido. Ele pode ser configurado no painel (Configurações).</p>`);
}

/* ============ Conta (fluxo D-24, demonstração) ============ */
let authStep = null; // { mode, name }
function accountPage(mode = "entrar") {
  if (me() && mode !== "recuperar") return profilePage();
  const tabs = [["entrar", "Entrar", "/conta"], ["cadastro", "Criar conta", "/conta/cadastro"], ["recuperar", "Recuperar acesso", "/conta/recuperar"]];
  const head = {
    entrar: ["Bem-vindo de volta.", "Digite seu e-mail. Vamos enviar um código de acesso de 6 dígitos."],
    cadastro: ["Se tem coragem, atravesse a porta.", "Seu lugar neste mundo está esperando."],
    recuperar: ["Perdeu o caminho de volta?", "Não existe senha para recuperar: basta pedir um novo código de acesso para o seu e-mail."],
  }[mode];
  const step = authStep?.mode === mode;
  return `<section class="section"><div class="wrap auth">
    <div class="tabs" role="tablist" aria-label="Acesso">${tabs.map(([id, l, href]) => `<a role="tab" href="${href}" data-link aria-selected="${id === mode}">${l}</a>`).join("")}</div>
    <div class="card auth-card">
      <h1 class="auth-title">${head[0]}</h1><p>${head[1]}</p>
      ${step
        ? `<form data-form="otp" class="stack"><label for="otp">Código recebido</label>
            <input id="otp" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required placeholder="000000">
            <button class="btn">Confirmar código</button><button type="button" class="btn ghost" data-action="auth-back">Usar outro e-mail</button></form>`
        : `<form data-form="auth" data-mode="${mode}" class="stack">
            ${mode === "cadastro" ? `<label for="au-name">Como quer ser chamado</label><input id="au-name" name="name" required maxlength="24" autocomplete="nickname">` : ""}
            <label for="au-mail">E-mail</label><input id="au-mail" name="email" type="email" required maxlength="120" autocomplete="email">
            ${mode === "cadastro" ? `<label class="check"><input type="checkbox" name="terms" required> Li os <a href="/termos" data-link>Termos de uso</a> e a <a href="/privacidade" data-link>Política de privacidade</a>.</label>` : ""}
            <button class="btn">${mode === "cadastro" ? "Atravessar a porta" : "Enviar código"}</button></form>`}
    </div>
    <p class="notice small">${DEMO_NOTE} Nenhum e-mail é enviado e nada é guardado além do apelido. Digite qualquer código de 6 dígitos (ex.: 123456).
      O acesso real usará o mesmo login do app: código por e-mail via Supabase Auth (decisão D-24), sem senha.</p>
  </div></section>`;
}
const PROFILE_TABS = [["/perfil", "Ficha"], ["/perfil/monstros", "Meus Monstros"], ["/perfil/biblioteca", "Biblioteca"]];
function profileShell(path, body) {
  const p = me();
  if (!p) return accountPage();
  return `<section class="section"><div class="wrap">
    <p class="kicker">Ficha do jogador ${DEMO_NOTE}</p>
    <div class="row profile-head">${avatar(p.avatar, 84)}<div><h1 style="margin:0">${esc(p.name)}</h1><p class="muted small" style="margin:4px 0 0">No arquivo desde ${new Date(p.joined).toLocaleDateString("pt-BR")}</p></div>
      <button class="btn ghost small" data-action="signout" style="margin-left:auto">Sair</button></div>
    <div class="tabs" role="tablist" aria-label="Perfil">${PROFILE_TABS.map(([h, l]) => `<a role="tab" href="${h}" data-link aria-selected="${h === path}">${l}</a>`).join("")}</div>
    ${body}</div></section>`;
}
function profilePage() {
  const p = me();
  if (!p) return accountPage();
  const st = [["Partidas", 0], ["Vitórias", 0], ["Como Monstro", 0], ["Como Inocente", 0], ["Monstros eliminados", 0], ["Infecções válidas", 0]];
  return profileShell("/perfil", `
    <h2>Avatar</h2><div class="row avatar-pick">${TONES.map((_, i) => `<button class="avatar-opt" data-action="avatar" data-id="${i}" aria-pressed="${i === p.avatar}" aria-label="Escolher avatar ${i + 1}">${avatar(i, 48)}</button>`).join("")}</div>
    <h2>Estatísticas</h2><div class="kpis">${st.map(([l, v]) => `<div class="card kpi"><div class="v">${v}</div><div class="l">${l}</div></div>`).join("")}</div>
    <p class="muted small">Sem partidas registradas. O histórico entre partidas ainda não é salvo (D-30: o banco entra quando houver histórico).</p>
    <div class="panel-grid">
      <div><h3>Conquistas</h3><p class="muted small">As conquistas ainda não foram definidas (responsável: Agente 5, Economia e Progressão).</p></div>
      <div><h3>Histórico de partidas</h3><p class="muted small">Nenhuma partida registrada.</p></div>
    </div>`);
}
function myMonstersPage() {
  const p = me();
  if (!p) return accountPage();
  const pref = p.preferred === "random" ? null : S().monsters.find((m) => m.id === p.preferred);
  return profileShell("/perfil/monstros", `
    <div class="card bundle"><div><span class="tag">Monstro preferido</span><h3 style="margin:8px 0 4px">${pref ? esc(pref.name) : "Aleatório"}</h3>
      <p class="muted small" style="margin:0">${pref ? "Usado se você for sorteado como Monstro." : "Um Monstro sorteado entre todos. Bônus de XP do modo aleatório: a definir (Agente 5)."}</p></div>
      ${pref ? '<button class="btn small" data-action="prefer" data-id="random">Voltar ao aleatório</button>' : ""}</div>
    <p class="notice small">A preferência <b>não muda a chance</b> de você ser sorteado como Monstro: só define o personagem, caso receba esse papel. Qualquer Monstro pode ser sorteado para qualquer jogador; possuir um Monstro libera apenas escolhê-lo como preferido. A preferência valerá nas partidas quando a escolha do tipo de Monstro for implementada (L-07).</p>
    <div class="grid photos">${pubMonsters().map((m) => {
      const have = p.unlocked.includes(m.id), is = pref?.id === m.id;
      return `<div class="card monster-card${have ? "" : " locked"}"><div class="monster-img">${monsterArt(m)}</div>
        <span class="tag ${have ? "ok" : ""}" style="margin-top:10px">${is ? "★ Preferido" : have ? "Desbloqueado" : "🔒 Bloqueado"}</span>
        <h3 style="margin:8px 0 2px">${esc(m.name)}</h3><p class="muted small" style="margin:0 0 6px">${esc(m.description || m.specialty)}</p>
        <p class="small muted" style="margin:0 0 8px">Domínio: não implementado (aguarda progressão, PGD-11)</p>
        <div class="row" style="gap:6px"><a class="btn ghost small" href="/monstros/${esc(m.slug)}" data-link>Ficha</a>
        ${have ? (is ? "" : `<button class="btn small" data-action="prefer" data-id="${m.id}">Tornar preferido</button>`) : '<a class="btn small" href="/loja" data-link>Desbloquear na loja</a>'}</div></div>`;
    }).join("")}</div>`);
}
let libF = { monster: "", type: "", col: "" };
function libraryPage() {
  const p = me();
  if (!p) return accountPage();
  const mine = visDocs().filter(owns);
  const list = mine.filter((d) => (!libF.monster || d.monsterId === Number(libF.monster)) && (!libF.type || d.type === libF.type) && (!libF.col || docsOf(S().collections.find((c) => c.id === Number(libF.col)) ?? { docIds: [] }).includes(d)));
  const sel = (k, label, opts) => `<div><label for="lf-${k}">${label}</label><select id="lf-${k}" data-input="lib-filter" data-key="${k}"><option value="">Todos</option>${opts.map(([v, l]) => `<option value="${v}"${String(v) === libF[k] ? " selected" : ""}>${esc(l)}</option>`).join("")}</select></div>`;
  return profileShell("/perfil/biblioteca", mine.length ? `
    <div class="form-grid" style="margin-bottom:16px">${sel("monster", "Monstro", pubMonsters().map((m) => [m.id, m.name]))}${sel("type", "Tipo de documento", Object.entries(DOC_TYPES))}${sel("col", "Coleção", S().collections.map((c) => [c.id, c.name]))}</div>
    ${list.length ? `<div class="grid">${list.map(docCard).join("")}</div>` : '<p class="muted">Nenhum documento com esses filtros.</p>'}`
    : '<p class="muted">Sua biblioteca está vazia. Os documentos adquiridos no <a href="/loja" data-link>Arquivo dos Monstros</a> aparecem aqui.</p>');
}
function docPage(id) {
  const d = visDocs().find((x) => x.id === id);
  if (!d) return null;
  const m = monsterOf(d), have = owns(d);
  const paras = (t) => esc(t).split(/\n\n+/).map((x) => `<p>${x.replace(/\n/g, "<br>")}</p>`).join("");
  const cols = S().collections.filter((c) => c.visible && docsOf(c).includes(d));
  return `<section class="section"><div class="wrap">
    <a href="${have ? "/perfil/biblioteca" : "/loja"}" data-link class="mono small">← ${have ? "voltar à biblioteca" : "voltar à loja"}</a>
    <article class="doc-paper" style="margin-top:18px">
      <p class="doc-type">${esc(DOC_TYPES[d.type] ?? d.type)} · Arquivo dos Monstros · ${esc(m?.name ?? "")}</p>
      <h1 class="doc-title">${esc(d.title)}</h1><p class="doc-meta">${esc(d.author)} · ${esc(d.date)}</p>
      ${paras(d.intro)}
      ${have ? `<h2>Método</h2><ul>${esc(d.strategies).split("\n").map((x) => `<li>${x}</li>`).join("")}</ul>
        <h2>Registro de uma partida</h2><div class="doc-log">${paras(d.examples)}</div>
        <h2>Quando desconfiarem</h2>${paras(d.suspicion)}`
      : `<div class="doc-locked"><p><b>O restante do documento está lacrado.</b> Método, registro de uma partida e conduta sob suspeita.</p>
        <div class="row"><button class="btn small" data-action="buy-doc" data-kind="doc" data-id="${d.id}">Adquirir por ${money(d.price)} (demo)</button>
        ${cols.map((c) => `<button class="btn ghost small" data-action="buy-doc" data-kind="col" data-id="${c.id}">${esc(c.name)}: ${money(c.price)} (demo)</button>`).join("")}</div></div>`}
    </article></div></section>`;
}

/* ============ Loja: A Monstros · B Arquivo dos Monstros · C Personalização ============ */
let storeTab = "monstros";
export function storeSections(cosmeticsHtml) {
  const tabs = [["monstros", "A · Monstros"], ["arquivo", "B · Arquivo dos Monstros"], ["personalizacao", "C · Personalização"]];
  return `<div class="tabs store-tabs" role="tablist" aria-label="Seções da loja">${tabs.map(([id, l]) => `<button role="tab" aria-selected="${id === storeTab}" data-action="storetab" data-id="${id}">${l}</button>`).join("")}</div>
  ${storeTab === "monstros" ? monsterStore() : storeTab === "arquivo" ? archiveStore() : cosmeticsHtml}`;
}
function monsterStore() {
  const p = me();
  const list = pubMonsters().filter((m) => storeOf(m).available);
  return `<p class="muted small">Qualquer Monstro pode ser sorteado para qualquer jogador. Desbloquear libera apenas escolhê-lo como preferido em "Meus Monstros". Aquisição só demonstrativa.</p>
  <div class="grid photos">${list.map((m) => {
    const e = storeOf(m), have = p?.unlocked.includes(m.id);
    return `<div class="card monster-card${have ? "" : " locked"}">
      <div class="monster-img">${monsterArt(m)}</div>
      <span class="tag ${have ? "ok" : ""}" style="margin-top:10px">${have ? "Desbloqueado" : "🔒 Bloqueado"}</span>
      <h3 style="margin:8px 0 2px">${esc(m.name)}</h3><p class="muted small">${esc(m.specialty)}</p>
      <p class="small" style="margin:0 0 8px">Compra avulsa: ${money(e.monsterPrice)} · Progressão no jogo: a definir</p>
      <div class="row" style="gap:6px"><a class="btn ghost small" href="/monstros/${esc(m.slug)}" data-link>Detalhes</a>
      ${have ? "" : `<button class="btn small" data-action="unlock" data-id="${m.id}">Desbloquear (demo)</button>`}</div></div>`;
  }).join("")}</div>`;
}
function archiveStore() {
  const cols = S().collections.filter((c) => c.visible && docsOf(c).length);
  return `<p class="muted small">Documentos encontrados no universo de PSICOSE: diários, cartas, relatórios e registros de quem já foi um Monstro. Ampliam a história e o método de cada criatura; não dão vantagem dentro das partidas.</p>
  ${cols.map((c) => `<div class="card bundle" style="margin-bottom:12px"><div><span class="tag">Coleção · ${docsOf(c).length} documentos</span><h3 style="margin:8px 0 4px">${esc(c.name)}</h3>
    <p class="muted small" style="margin:0">${esc(c.description)}</p></div>
    <div class="row"><span class="price">${money(c.price)}</span><button class="btn small" data-action="buy-doc" data-kind="col" data-id="${c.id}">Adquirir coleção (demo)</button></div></div>`).join("")}
  <div class="grid" style="margin-top:18px">${visDocs().map(docCard).join("")}</div>`;
}

/* ============ Rankings ============ */
let rankCat = null;
// Exemplo FICTÍCIO e determinístico, só para visualizar o layout. Nunca exibido como resultado real.
function demoRows(cat) {
  const seedN = cat.id.length * 7;
  return Array.from({ length: 10 }, (_, i) => {
    const matches = 6 + ((seedN + i * 11) % 30);
    const raw = cat.id === "monstros-eliminados" ? 14 - i : cat.id === "melhor-detetive" ? 40 - i * 3 : cat.id === "desempenho-monstro" ? 2.4 - i * 0.15 : 78 - i * 4;
    const score = cat.id === "desempenho-monstro" ? raw.toFixed(2) : cat.id.match(/monstro$|inocente/) ? `${raw}%` : raw;
    return { name: `Jogador fictício ${String(i + 1).padStart(2, "0")}`, avatar: (i + seedN) % TONES.length, score, matches };
  });
}
function rankingsPage() {
  const cats = S().rankingCats.filter((c) => c.visible);
  if (!cats.length) return page("Classificação", "Rankings", `<p class="muted">Nenhuma categoria publicada.</p>`);
  const cat = cats.find((c) => c.id === rankCat) ?? cats[0];
  const rows = SX().rankingDemo ? demoRows(cat) : [];
  return page("Classificação", "Rankings", `
    <div class="tabs" role="tablist" aria-label="Categorias">${cats.map((c) => `<button role="tab" aria-selected="${c === cat}" data-action="rankcat" data-id="${c.id}">${esc(c.name)}</button>`).join("")}</div>
    <div class="paper" style="margin-bottom:16px"><h3>${esc(cat.name.toUpperCase())}</h3><p style="margin:0"><b>Critério:</b> ${esc(cat.criterion)}</p>
      <p class="small" style="margin:6px 0 0"><b>Desempate:</b> ${esc(cat.tie)} · <b>Mínimo:</b> ${cat.min} ${cat.min === 1 ? "partida" : "partidas"} · Critério proposto, aguarda aprovação (PGD-11).</p></div>
    <p class="notice"><b>Ainda não há resultados reais:</b> o histórico de partidas não é registrado no beta (D-30).${rows.length ? ` A tabela abaixo é um <b>exemplo fictício</b> para visualizar o layout.` : ""}</p>
    ${rows.length ? `<div class="table-wrap"><table class="rank"><caption class="sr-only">Exemplo fictício</caption><thead><tr><th>#</th><th>Jogador</th><th>Pontuação</th><th>Partidas</th></tr></thead><tbody>
      ${rows.map((r, i) => `<tr><td class="mono">${i + 1}º</td><td><span class="row" style="flex-wrap:nowrap;gap:10px">${avatar(r.avatar, 32)}${esc(r.name)}</span></td><td class="mono">${r.score}</td><td>${r.matches}</td></tr>`).join("")}
    </tbody></table></div><p class="small muted"><span class="demo">EXEMPLO FICTÍCIO</span> Nomes e números gerados, sem relação com partidas reais.</p>` : ""}`);
}

/* ============ Rotas públicas ============ */
export const NAV_EXTRA = [{ path: "/rankings", label: "Rankings" }];
export function portalPage(path) {
  const routes = {
    "/rankings": ["Rankings", rankingsPage],
    "/parceiros": ["Parceiros", partnersPage],
    "/afiliados": ["Seja um afiliado", affiliatePage],
    "/contato": ["Contato", contactPage],
    "/termos": ["Termos de uso", () => page("Institucional", "Termos de uso", textBlock(X().terms))],
    "/privacidade": ["Política de privacidade", () => page("Institucional", "Política de privacidade", textBlock(X().privacy))],
    "/conta": ["Conta", () => accountPage("entrar")],
    "/conta/cadastro": ["Criar conta", () => accountPage("cadastro")],
    "/conta/recuperar": ["Recuperar acesso", () => accountPage("recuperar")],
    "/perfil": ["Perfil", profilePage],
    "/afiliado": ["Área do afiliado", affiliateAreaPage],
    "/perfil/monstros": ["Meus Monstros", myMonstersPage],
    "/perfil/biblioteca": ["Biblioteca", libraryPage],
  };
  if (routes[path]) return { path: path.startsWith("/conta") || path.startsWith("/perfil") ? "/conta" : path, label: routes[path][0], view: routes[path][1] };
  const r = path.match(/^\/r\/([A-Za-z0-9]+)$/);
  if (r) return { path: "/conta", label: "Convite", view: () => referralPage(r[1]) };
  const g = path.match(/^\/arquivo\/(\d+)$/);
  if (g) {
    const html = docPage(Number(g[1]));
    if (html) return { path: "/loja", label: "Arquivo dos Monstros", view: () => html };
  }
  return null;
}
export const accountLink = () => (me() ? { path: "/conta", label: "Perfil" } : { path: "/conta", label: "Entrar" });

/* ============ Ações e formulários públicos ============ */
const requireLogin = () => {
  if (me()) return true;
  toast("Entre na sua conta para continuar.");
  navigate("/conta");
  return false;
};
export const portalActions = {
  ...affiliateActions,
  sound(el) {
    snd.on = !snd.on;
    saveSnd();
    snd.on ? play() : audio?.pause();
    el.setAttribute("aria-pressed", String(snd.on));
    el.textContent = snd.on ? "♪ Som ligado" : "♪ Som desligado";
  },
  storetab(el) { storeTab = el.dataset.id; rerender(); },
  rankcat(el) { rankCat = el.dataset.id; rerender(); },
  "auth-back"() { authStep = null; rerender(); },
  signout() { S().profile = null; db.save(); toast("Você saiu."); navigate("/"); },
  avatar(el) { me().avatar = Number(el.dataset.id); db.save(); rerender(); },
  unlock(el) {
    if (!requireLogin()) return;
    me().unlocked.push(Number(el.dataset.id));
    db.save();
    rerender();
    toast("Demonstração: Monstro desbloqueado neste navegador. Nenhuma cobrança foi feita.");
  },
  "buy-doc"(el) {
    if (!requireLogin()) return;
    const ids = el.dataset.kind === "col" ? docsOf(S().collections.find((c) => c.id === Number(el.dataset.id))).map((d) => d.id) : [Number(el.dataset.id)];
    me().docs = [...new Set([...me().docs, ...ids])];
    db.save();
    rerender();
    toast("Demonstração: documento na sua biblioteca. Nenhuma cobrança foi feita.");
  },
  prefer(el) {
    const id = el.dataset.id;
    me().preferred = id === "random" ? "random" : Number(id);
    db.save();
    rerender();
    toast(id === "random" ? "Monstro preferido: aleatório." : "Monstro preferido atualizado.");
  },
};
const isHttp = (u) => /^https?:\/\/[^\s]+\.[^\s]+/i.test(u);
export const portalForms = {
  ...affiliateForms,
  auth(f) {
    const name = f.elements.name?.value.trim();
    authStep = { mode: f.dataset.mode, name };
    rerender();
    toast("Demonstração: nenhum e-mail foi enviado. Use qualquer código de 6 dígitos.");
  },
  otp(f) {
    if (!/^\d{6}$/.test(f.elements.code.value)) return toast("O código tem 6 dígitos.");
    const old = me();
    S().profile = old ?? { name: authStep?.name || "Visitante", avatar: 0, joined: Date.now(), unlocked: [], docs: [], preferred: "random" };
    if (!old) attachReferral(S().profile);
    authStep = null;
    if (db.save()) navigate("/perfil");
  },
  affiliate(f) {
    const url = f.elements.url.value.trim();
    if (!isHttp(url)) return toast("Informe um link começando com https://");
    S().affiliates.push({ id: nextId(S().affiliates), name: f.elements.name.value.trim(), url, about: f.elements.about.value.trim(), status: "pendente", at: Date.now() });
    if (db.save()) { f.reset(); toast("Candidatura registrada (demonstração, só neste navegador)."); }
  },
};
export const portalInputs = {
  ...affiliateInputs,
  "lib-filter"(el) { libF[el.dataset.key] = el.value; rerender(); },
  volume(el) {
    snd.volume = Number(el.value);
    if (audio) audio.volume = snd.volume;
    saveSnd();
  },
};

/* ============ Painel: módulos novos ============ */
const field = ([k, label, type = "text", max = 200], v) =>
  type === "select"
    ? `<div><label for="g-${k}">${label}</label><select id="g-${k}" name="${k}">${max.map(([o, l]) => `<option value="${o}"${String(o) === String(v) ? " selected" : ""}>${esc(l)}</option>`).join("")}</select></div>`
    : type === "textarea"
    ? `<div style="grid-column:1/-1"><label for="g-${k}">${label}</label><textarea id="g-${k}" name="${k}" maxlength="${max}">${esc(v ?? "")}</textarea></div>`
    : type === "checkbox"
      ? `<label class="check" style="grid-column:1/-1"><input type="checkbox" name="${k}"${v ? " checked" : ""}> ${label}</label>`
      : `<div><label for="g-${k}">${label}</label><input id="g-${k}" name="${k}" type="${type}" ${type === "number" ? 'min="0" step="0.01" required' : `maxlength="${max}"`} value="${esc(v ?? "")}"></div>`;
const formOf = (name, spec, obj, extra = "") => `<form data-form="${name}" class="form-grid"><input type="hidden" name="id" value="${obj.id ?? obj.monsterId ?? ""}">
  ${spec.map((s) => field(s, obj[s[0]])).join("")}${extra}
  <div class="row" style="grid-column:1/-1;margin-top:14px"><button class="btn">Salvar</button><button type="button" class="btn ghost" data-action="close">Cancelar</button></div></form>`;
const readForm = (f, spec) => Object.fromEntries(spec.map(([k, , type]) => [k, type === "checkbox" ? f.elements[k].checked : type === "number" ? Math.max(0, Number(f.elements[k].value) || 0) : f.elements[k].value.trim()]));
const top = (title, btn = "") => `<div class="admin-top"><h1 style="margin:0">${title}</h1>${btn}</div>`;
const listItem = (main, sub, tag, btns) => `<div class="list-item"><div style="min-width:0"><b>${main}</b><div class="small muted">${sub}</div></div>
  <div class="row" style="gap:6px;justify-content:flex-end">${tag}${btns}</div></div>`;

const STORE_SPEC = [["available", "Monstro disponível na loja", "checkbox"], ["monsterPrice", "Preço demonstrativo do Monstro (R$)", "number"]];
const DOC_SPEC = () => [["title", "Título"], ["monsterId", "Monstro", "select", S().monsters.map((m) => [m.id, m.name])], ["type", "Tipo", "select", Object.entries(DOC_TYPES)], ["author", "Autor (no universo)"], ["date", "Data (no universo)"], ["price", "Preço demonstrativo (R$)", "number"],
  ["intro", "Abertura narrativa (prévia gratuita)", "textarea", 6000], ["strategies", "Método: uma estratégia por linha", "textarea", 6000], ["examples", "Registro de uma partida", "textarea", 6000], ["suspicion", "Quando desconfiarem", "textarea", 6000], ["visible", "Disponível na loja", "checkbox"]];
const COL_SPEC = [["name", "Nome da coleção"], ["price", "Preço demonstrativo (R$)", "number"], ["description", "Descrição", "textarea", 400], ["all", "Incluir todos os documentos (atuais e futuros)", "checkbox"], ["visible", "Disponível na loja", "checkbox"]];
const PARTNER_SPEC = [["name", "Nome"], ["url", "Link externo (https://)", "url"], ["description", "Descrição", "textarea", 300], ["visible", "Exibir no site", "checkbox"]];
const RANK_SPEC = [["name", "Nome da categoria"], ["min", "Mínimo de partidas", "number"], ["criterion", "Critério", "textarea", 600], ["tie", "Desempate", "textarea", 300], ["visible", "Exibir no site", "checkbox"]];

function storeAdmin() {
  return `${top("Monstros na loja")}
  <p class="muted small">Preços demonstrativos. Desbloquear um Monstro só libera escolhê-lo como preferido (regra anti-vantagem aprovada).</p>
  <div class="card">${S().monsters.map((m) => { const e = storeOf(m);
    return listItem(esc(m.name), `Preço ${money(e.monsterPrice)}`, `<span class="tag ${e.available ? "ok" : "red"}">${e.available ? "Na loja" : "Fora"}</span>`,
      `<button class="btn ghost small" data-action="st-edit" data-id="${m.id}">Editar</button>`); }).join("")}</div>`;
}
function archiveAdmin() {
  return `${top("Arquivo dos Monstros", '<div class="row" style="gap:6px"><button class="btn" data-action="doc-new">+ Documento</button><button class="btn ghost" data-action="col-new">+ Coleção</button></div>')}
  <p class="muted small">Documentos narrativos à venda (preços demonstrativos). A abertura é a prévia gratuita; o restante só aparece para quem tem o documento.</p>
  <h3>Coleções</h3><div class="card">${S().collections.map((c) => listItem(esc(c.name), `${docsOf(c).length} documentos · ${money(c.price)}${c.all ? " · inclui todos" : ""}`, `<span class="tag ${c.visible ? "ok" : "red"}">${c.visible ? "Na loja" : "Oculta"}</span>`,
    `<button class="btn ghost small" data-action="col-edit" data-id="${c.id}">Editar</button><button class="btn ghost small" data-action="col-del" data-id="${c.id}">Excluir</button>`)).join("") || '<p class="muted">Nenhuma coleção.</p>'}</div>
  <h3 style="margin-top:18px">Documentos</h3><div class="card">${S().documents.map((d) => listItem(esc(d.title), `${esc(monsterOf(d)?.name ?? "")} · ${esc(DOC_TYPES[d.type] ?? d.type)} · ${money(d.price)}`, `<span class="tag ${d.visible ? "ok" : "red"}">${d.visible ? "Na loja" : "Oculto"}</span>`,
    `<button class="btn ghost small" data-action="doc-edit" data-id="${d.id}">Editar</button><button class="btn small" data-action="doc-toggle" data-id="${d.id}">${d.visible ? "Ocultar" : "Exibir"}</button>`)).join("")}</div>`;
}
const colDocsField = (c) => `<fieldset style="grid-column:1/-1;border:1px solid var(--line);margin-top:12px"><legend class="small">Documentos da coleção (se não incluir todos)</legend>
  ${S().documents.map((d) => `<label class="check"><input type="checkbox" name="doc" value="${d.id}"${c.docIds?.includes(d.id) ? " checked" : ""}> ${esc(d.title)} <span class="small muted">(${esc(monsterOf(d)?.name ?? "")})</span></label>`).join("")}</fieldset>`;
function partnersAdmin() {
  const list = S().partners;
  return `${top("Parceiros", `<button class="btn" data-action="pa-new">+ Cadastrar parceiro</button>`)}
  <p class="muted small">Empresas e projetos do proprietário exibidos no rodapé e na página Parceiros. Os links abrem em nova aba.</p>
  <div class="card">${list.length ? list.map((p) => listItem(esc(p.name), esc(p.url), `<span class="tag ${p.visible ? "ok" : "red"}">${p.visible ? "Visível" : "Oculto"}</span>`,
    `<button class="btn ghost small" data-action="pa-edit" data-id="${p.id}">Editar</button><button class="btn small" data-action="pa-toggle" data-id="${p.id}">${p.visible ? "Ocultar" : "Exibir"}</button><button class="btn ghost small" data-action="pa-del" data-id="${p.id}">Excluir</button>`)).join("") : `<p class="muted">Nenhum parceiro cadastrado.</p>`}</div>`;
}
const AFF_STATUS = ["pendente", "aprovado", "recusado"];
function affiliatesAdmin() {
  const list = S().affiliates;
  return `${top("Afiliados", DEMO)}
  <p class="muted small">Candidaturas enviadas pela página "Seja um afiliado" neste navegador. As condições do programa ainda não foram definidas (Agente 5).</p>
  <div class="table-wrap"><table><thead><tr><th>Nome</th><th>Canal</th><th>Público</th><th>Data</th><th>Status</th><th></th></tr></thead><tbody>
  ${list.length ? list.map((a) => `<tr><td>${esc(a.name)}</td><td><a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.url)}</a></td><td class="small">${esc(a.about)}</td>
    <td>${new Date(a.at).toLocaleDateString("pt-BR")}</td><td><select data-input="aff-status" data-id="${a.id}" aria-label="Status de ${esc(a.name)}">${AFF_STATUS.map((s) => `<option${s === a.status ? " selected" : ""}>${s}</option>`).join("")}</select>${a.code ? `<div class="small mono">Código ${a.code}</div>` : ""}</td>
    <td><button class="btn ghost small" data-action="af-del" data-id="${a.id}">Excluir</button></td></tr>`).join("") : `<tr><td colspan="6" class="muted">Nenhuma candidatura.</td></tr>`}
  </tbody></table></div>`;
}
function rankingsAdmin() {
  return `${top("Rankings e categorias")}
  <p class="muted small">Critérios propostos, aguardam aprovação (PGD-11). Não há resultados reais: o histórico de partidas ainda não é registrado (D-30).</p>
  <form data-form="rank-demo" class="card"><label class="check"><input type="checkbox" name="demo"${SX().rankingDemo ? " checked" : ""}> Exibir no site o exemplo fictício (marcado como EXEMPLO FICTÍCIO)</label>
    <button class="btn small" style="margin-top:8px">Salvar</button></form>
  <div class="card" style="margin-top:14px">${S().rankingCats.map((c) => listItem(esc(c.name), esc(c.criterion), `<span class="tag ${c.visible ? "ok" : "red"}">${c.visible ? "Visível" : "Oculta"}</span>`,
    `<button class="btn ghost small" data-action="rk-edit" data-id="${c.id}">Editar</button>`)).join("")}</div>`;
}
export const PORTAL_MODULES = [
  { path: "/admin/loja-monstros", label: "Monstros na loja", view: storeAdmin },
  { path: "/admin/arquivo", label: "Arquivo dos Monstros", view: archiveAdmin },
  { path: "/admin/rankings", label: "Rankings", view: rankingsAdmin },
  { path: "/admin/parceiros", label: "Parceiros", view: partnersAdmin },
  { path: "/admin/afiliados", label: "Afiliados", view: affiliatesAdmin },
  { path: "/admin/pagamentos-afiliados", label: "Pagamentos de Afiliados", view: payoutsAdmin },
];

const byId = (list, el) => list.find((x) => String(x.id) === el.dataset.id);
const done = (msg) => { if (db.save()) { closeDialog(); refresh(); toast(msg); } };
export const portalAdminActions = {
  "doc-new": () => openDialog("Novo documento", formOf("doc", DOC_SPEC(), { visible: true, price: docPrice, type: "diario" })),
  "doc-edit": (el) => openDialog("Editar documento", formOf("doc", DOC_SPEC(), byId(S().documents, el))),
  "doc-toggle": (el) => { const d = byId(S().documents, el); d.visible = !d.visible; done(d.visible ? "Documento na loja." : "Documento oculto."); },
  "col-new": () => openDialog("Nova coleção", formOf("col", COL_SPEC, { visible: true, docIds: [] }, colDocsField({ docIds: [] }))),
  "col-edit": (el) => { const c = byId(S().collections, el); openDialog("Editar coleção", formOf("col", COL_SPEC, c, colDocsField(c))); },
  "col-del": (el) => { if (!confirm("Excluir esta coleção? Documentos já adquiridos continuam na biblioteca.")) return; S().collections = S().collections.filter((x) => x !== byId(S().collections, el)); done("Coleção excluída."); },
  "st-edit": (el) => { const m = S().monsters.find((x) => x.id === Number(el.dataset.id)); openDialog(`Loja: ${esc(m.name)}`, formOf("store", STORE_SPEC, storeOf(m))); },
  "pa-new": () => openDialog("Novo parceiro", formOf("partner", PARTNER_SPEC, { visible: true }, `<input type="hidden" name="image" value="">${imageField()}`)),
  "pa-edit": (el) => { const p = byId(S().partners, el); openDialog("Editar parceiro", formOf("partner", PARTNER_SPEC, p, `<input type="hidden" name="image" value="${esc(p.logo)}">${imageField()}`)); },
  "pa-toggle": (el) => { const p = byId(S().partners, el); p.visible = !p.visible; done(p.visible ? "Parceiro exibido." : "Parceiro oculto."); },
  "pa-del": (el) => { if (!confirm("Excluir este parceiro?")) return; S().partners = S().partners.filter((x) => x !== byId(S().partners, el)); done("Parceiro excluído."); },
  "af-del": (el) => { if (!confirm("Excluir esta candidatura?")) return; S().affiliates = S().affiliates.filter((x) => x !== byId(S().affiliates, el)); done("Candidatura excluída."); },
  "rk-edit": (el) => openDialog("Editar categoria", formOf("rank", RANK_SPEC, byId(S().rankingCats, el))),
};
export const portalAdminForms = {
  doc(f) {
    const spec = DOC_SPEC(), data = readForm(f, spec);
    if (!data.title) return toast("Informe o título.");
    const list = S().documents, id = Number(f.elements.id.value) || nextId(list);
    const d = { ...list.find((x) => x.id === id), id, ...data, monsterId: Number(data.monsterId) };
    const i = list.findIndex((x) => x.id === id);
    i >= 0 ? (list[i] = d) : list.push(d);
    done("Documento salvo.");
  },
  col(f) {
    const data = readForm(f, COL_SPEC);
    if (!data.name) return toast("Informe o nome.");
    const docIds = [...f.querySelectorAll('input[name="doc"]:checked')].map((x) => Number(x.value));
    if (!data.all && !docIds.length) return toast("Escolha documentos ou marque \"incluir todos\".");
    const list = S().collections, id = Number(f.elements.id.value) || nextId(list);
    const c = { id, ...data, docIds };
    const i = list.findIndex((x) => x.id === id);
    i >= 0 ? (list[i] = c) : list.push(c);
    done("Coleção salva.");
  },
  store(f) {
    const m = S().monsters.find((x) => x.id === Number(f.elements.id.value));
    Object.assign(storeOf(m), readForm(f, STORE_SPEC));
    done("Loja e guia salvos.");
  },
  partner(f) {
    const data = readForm(f, PARTNER_SPEC);
    if (!data.name) return toast("Informe o nome.");
    if (!isHttp(data.url)) return toast("O link precisa começar com https://");
    const list = S().partners, id = Number(f.elements.id.value) || nextId(list);
    const p = { id, ...data, logo: f.elements.image.value };
    const i = list.findIndex((x) => x.id === id);
    i >= 0 ? (list[i] = p) : list.push(p);
    done("Parceiro salvo.");
  },
  rank(f) {
    const c = S().rankingCats.find((x) => x.id === f.elements.id.value);
    const data = readForm(f, RANK_SPEC);
    if (!data.name) return toast("Informe o nome.");
    Object.assign(c, data, { min: Math.max(1, Math.round(data.min)) });
    done("Categoria salva.");
  },
  "rank-demo"(f) { SX().rankingDemo = f.elements.demo.checked; done("Preferência salva."); },
};
export const portalAdminInputs = {
  "aff-status"(el) { const a = byId(S().affiliates, el); a.status = el.value; if (a.status === "aprovado") onAffiliateApproved(a); db.save(); refresh(); toast(`Status: ${a.status}.`); },
};
