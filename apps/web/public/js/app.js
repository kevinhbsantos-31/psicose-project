// Portal PSICOSE — prévia visual. Sem backend: dados de demonstração no localStorage deste navegador.
// Ordem importa (ciclo de módulos): admin.js antes de portal.js.
import { adminActions, adminForms, adminInputs, renderAdmin } from "./admin.js";
import { MONSTER_TEXTS, MONSTER_WARNING } from "./monstros.js";
import { accountLink, footer, NAV_EXTRA, portalActions, portalForms, portalInputs, portalPage, seedExtra, soundControl, storeSections } from "./portal.js";

/* ============ Marca ============ */
// Logotipo oficial: cópia exata de assets/branding/logo-psicose.jpeg. Nunca recortar, filtrar ou reeditar o arquivo.
export const BRAND = {
  logoImage: "img/logo-psicose.jpeg",
  logoAlt: "PSICOSE. Fotografia antiga de um cômodo abandonado: numa porta escura, uma figura esguia apoia na parede uma mão de dedos longos.",
};

/* ============ Dados ============ */
// Campos da ficha de cada Monstro. Vazio = ainda não definido (exibido como "A definir"; nunca inventar).
export const MONSTER_FIELDS = [
  ["description", "Descrição e identidade"],
  ["origin", "Origem e história"],
  ["appearance", "Aparência e características"],
  ["specialty", "Especialidade"],
  ["behavior", "Comportamento"],
  ["ability", "Habilidade e forma de manipulação"],
  ["infection", "Condição para a infecção"],
  ["phrase", "Frase principal da vítima (gatilho)"],
  ["mainCondition", "Condição principal"],
  ["variations", "Variações válidas da frase"],
  ["limitations", "Limitações e como identificar ou evitar"],
  ["threat", "Nível de ameaça"],
];
export const slugify = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Fonte: cards oficiais enviados pelo proprietário (imagens em /img/monstros/). Só o que está nos cards.
const OFFICIAL_MONSTERS = [
  ["O Concordante", "01-o-concordante", "Manipulação pela confiança.", "A vítima aceita explicitamente uma afirmação ou informação apresentada pelo Monstro.", "Eu confirmo o que você disse."],
  ["O Contestador", "02-o-contestador", "Distorção da realidade.", "A vítima nega explicitamente uma informação ou acontecimento apresentado pelo Monstro.", "Isso nunca aconteceu."],
  ["O Silencioso", "03-o-silencioso", "Pressão psicológica.", "A vítima declara que não pretende responder ou falar sobre determinado assunto.", "Não vou responder a isso."],
  ["O Socorro", "04-o-socorro", "Dependência e vulnerabilidade.", "A vítima pede ajuda explicitamente.", "Eu preciso de ajuda."],
  ["O Delator", "05-o-delator", "Desconfiança e acusação.", "A vítima acusa explicitamente outro participante.", "Eu acuso [codinome]."],
  ["O Confidente", "06-o-confidente", "Intimidade e segredos.", "A vítima promete compartilhar algo em segredo com o Monstro, especificamente no PV dele.", "Vou contar só para você."],
  ["O Eco", "07-o-eco", "Imitação e repetição.", "A vítima reproduz uma expressão específica enviada anteriormente pelo Monstro.", "", "Repetição de uma sequência de pelo menos quatro palavras consecutivas da mensagem de isca."],
  ["O Reflexo", "08-o-reflexo", "Identificação e confusão de identidade.", "A vítima declara uma identificação explícita com o Monstro.", "Somos iguais."],
  ["O Anfitrião", "09-o-anfitriao", "Convite e permissão.", "A vítima concede verbalmente permissão para que uma presença entre.", "Pode entrar."],
  ["O Observador", "10-o-observador", "Paranoia e percepção.", "A vítima declara ter percebido uma presença ou figura que os outros não conseguem confirmar.", "Eu vi alguém aqui."],
];
export const SHOP_CATEGORIES = [
  { id: "monstros", name: "Monstros" },
  { id: "skins", name: "Skins" },
  { id: "insignias", name: "Insígnias" },
  { id: "personalizacoes", name: "Personalizações" },
  { id: "colecionaveis", name: "Itens colecionáveis" },
  { id: "especiais", name: "Conteúdos especiais" },
];

function seed() {
  const x = seedExtra();
  const p = (id, category, name, description, price) => ({ id, category, name, description, price, image: "", visible: true });
  return {
    ...x,
    monsters: OFFICIAL_MONSTERS.map(([name, file, specialty, infection, phrase, mainCondition = ""], i) => ({
      ...Object.fromEntries(MONSTER_FIELDS.map(([k]) => [k, ""])),
      id: i + 1,
      slug: slugify(name),
      name,
      image: `img/monstros/${file}.jpeg`,
      specialty,
      infection,
      phrase,
      mainCondition,
      ...MONSTER_TEXTS[i + 1],
      published: true,
    })),
    products: [
      p(1, "monstros", "Visual alternativo de Monstro", "Aparência alternativa para um Monstro. Apenas cosmético.", 14.9),
      p(2, "monstros", "Pacote de efeitos de Monstro", "Efeitos visuais exclusivos. Sem vantagem em jogo.", 9.9),
      p(3, "skins", "Avatar \"Fita gasta\"", "Avatar com textura de fita VHS desgastada.", 7.9),
      p(4, "skins", "Avatar \"Retrato antigo\"", "Avatar em estilo de fotografia envelhecida.", 7.9),
      p(5, "insignias", "Insígnia \"Sobrevivente\"", "Insígnia de perfil. Visível só fora das partidas.", 4.9),
      p(6, "insignias", "Insígnia \"Arquivista\"", "Insígnia de perfil. Visível só fora das partidas.", 4.9),
      p(7, "personalizacoes", "Tema de chat \"Papel velho\"", "Aparência do chat em tons de papel antigo.", 5.9),
      p(8, "personalizacoes", "Moldura \"Interferência\"", "Moldura animada para o avatar.", 5.9),
      p(9, "colecionaveis", "Fita perdida nº 1", "Item colecionável de arquivo.", 3.9),
      p(10, "colecionaveis", "Fotografia rasgada", "Item colecionável de arquivo.", 3.9),
      p(11, "especiais", "Caixa de arquivos (edição de lançamento)", "Conjunto de cosméticos de lançamento.", 24.9),
      p(12, "especiais", "Trilha sonora (prévia)", "Faixas da trilha ambiente do jogo.", 12.9),
    ],
    content: {
      heroTagline: "Alguém nesta sala não é quem diz ser.",
      heroIntro: "Quatro pessoas. Um chat. Um Monstro escondido entre elas. Em PSICOSE, cada palavra pode ser uma pista ou uma armadilha.",
      aboutPremise:
        "PSICOSE é um jogo multiplayer de dedução social e terror psicológico. Quatro jogadores entram numa sala privada. Três são Inocentes. Um é o Monstro, e ninguém sabe quem.",
      aboutObjective:
        "Os Inocentes precisam descobrir o Monstro e eliminá-lo com o revólver. O Monstro precisa infectar e dividir o grupo sem se revelar.",
      ...x.content,
      aboutMultiplayer:
        "Partidas em salas privadas por código, com 4 jogadores. Ninguém vê nomes reais durante a partida: todos usam codinomes temporários. A conversa acontece por chat público e mensagens privadas.",
    },
    settings: {
      siteName: "PSICOSE",
      maintenance: false,
      maintenanceText: "Portal em manutenção programada. Algumas áreas podem ficar indisponíveis.",
      showShop: true,
      effects: true,
      contactEmail: "",
      ...x.settings,
    },
  };
}

const KEY = "psicose.portal.v2"; // v2: Monstros oficiais (v1 tinha registros provisórios)
let state = load();
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      const base = seed();
      // Campos vazios salvos antes recebem os textos oficiais; o que foi editado no painel é mantido.
      const fill = (m) => { const b = base.monsters.find((x) => x.id === m.id); return b ? { ...m, ...Object.fromEntries(MONSTER_FIELDS.filter(([k]) => !m[k] && b[k]).map(([k]) => [k, b[k]])) } : m; };
      return { ...base, ...s, monsters: (s.monsters ?? base.monsters).map(fill), content: { ...base.content, ...s.content }, settings: { ...base.settings, ...s.settings } };
    }
  } catch {}
  return seed();
}
export const db = {
  get: () => state,
  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch {
      toast("Não foi possível salvar neste navegador (armazenamento cheio ou bloqueado).");
      return false;
    }
  },
  reset() {
    state = seed();
    this.save();
  },
};

/* ============ Utilitários ============ */
export const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const money = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
let toastTimer;
export function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
}
// Caminhos relativos ao index.html: funcionam no server.mjs e no Live Server (subpasta). Remove "/" inicial de dados salvos antes.
const asset = (p) => p.replace(/^\/(?=img\/)/, "");
let uid = 0;
export function monsterArt(m) {
  if (m.image) return `<img src="${esc(asset(m.image))}" alt="Card de ${esc(m.name)}" loading="lazy" decoding="async">`;
  const i = m.id;
  const g = `mg${++uid}`;
  const top = 250 - (150 + ((i * 37) % 60));
  const lean = ((i * 13) % 9) - 4;
  const w = 14 + (i % 3) * 3;
  return `<svg viewBox="0 0 200 250" role="img" aria-label="Imagem provisória: silhueta indistinta">
    <defs><radialGradient id="${g}" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#5a4634"/><stop offset="1" stop-color="#120d09"/></radialGradient></defs>
    <rect width="200" height="250" fill="url(#${g})"/>
    <g transform="rotate(${lean} 100 250)" fill="#2a2420" opacity=".9" style="filter:blur(1.2px)">
      <ellipse cx="100" cy="${top}" rx="${w}" ry="${w + 6}"/>
      <path d="M${76 - (i % 3) * 5} 250 C78 ${top + 70} 86 ${top + 24} 100 ${top + 24} C114 ${top + 24} 122 ${top + 70} ${124 + (i % 3) * 5} 250Z"/>
    </g>
    <circle cx="${95 + lean}" cy="${top - 2}" r="1.4" fill="#e9dcc0" opacity=".6"/><circle cx="${105 + lean}" cy="${top - 2}" r="1.4" fill="#e9dcc0" opacity=".6"/>
    <text x="12" y="238" fill="#d8cbb0" opacity=".55" font-family="Special Elite, monospace" font-size="12">ARQ. ${String(i).padStart(3, "0")}</text>
  </svg>`;
}
export function productArt(p) {
  if (p.image) return `<img src="${esc(asset(p.image))}" alt="${esc(p.name)}" loading="lazy">`;
  const cat = SHOP_CATEGORIES.find((c) => c.id === p.category)?.name ?? "";
  return `<svg viewBox="0 0 200 200" role="img" aria-label="Imagem provisória do produto">
    <rect width="200" height="200" fill="#2a1f16"/><rect x="40" y="58" width="120" height="84" rx="4" fill="#120d09" stroke="#5a4330" stroke-width="3"/>
    <circle cx="78" cy="100" r="16" fill="none" stroke="#5a4330" stroke-width="3"/><circle cx="122" cy="100" r="16" fill="none" stroke="#5a4330" stroke-width="3"/>
    <rect x="70" y="126" width="60" height="6" fill="#7d1414"/>
    <text x="100" y="178" text-anchor="middle" fill="#d8cbb0" opacity=".6" font-family="Special Elite, monospace" font-size="12">${esc(cat.toUpperCase())}</text>
  </svg>`;
}
const logo = () => `PSICOSE`;

/* ============ Páginas públicas ============ */
const c = () => state.content;

function home() {
  return `
  <section class="hero">
    <div class="hero-bg" style="background-image:url('${BRAND.logoImage}')" aria-hidden="true"></div>
    <div class="vhs-bar" aria-hidden="true"></div>
    <div class="vhs-osd" aria-hidden="true"><span class="rec">REC</span><span id="osd-clock">PLAY ▸ 00:00:00</span></div>
    <div class="wrap hero-inner">
      <h1 class="sr-only">PSICOSE</h1>
      <p class="kicker" style="margin:0">Arquivo recuperado · fita 01</p>
      <div class="logo-card"><img src="${BRAND.logoImage}" alt="${esc(BRAND.logoAlt)}" width="1536" height="1024" fetchpriority="high"></div>
      <p class="lead">${esc(c().heroTagline)}</p>
      <div class="row" style="justify-content:center"><a class="btn" href="/sobre" data-link>Conhecer o jogo</a><a class="btn ghost" href="/monstros" data-link>Entrar no universo</a></div>
    </div>
  </section>
  <section class="section"><div class="wrap split">
    <div>
      <p class="kicker">O que é</p>
      <h2>Ninguém aqui é confiável.</h2>
      <p>${esc(c().heroIntro)}</p>
      <a class="btn ghost" href="/dicas" data-link>Ler as regras e dicas</a>
    </div>
    <div class="paper" style="transform:rotate(1.2deg)">
      <h3>NOTA ENCONTRADA</h3>
      <p>Não confie no primeiro que pedir ajuda.<br>Não autorize o disparo sem pensar.<br>E releia o chat. As mensagens não podem ser apagadas.</p>
      <p class="small" style="margin:0">— autor desconhecido</p>
    </div>
  </div></section>
  <section class="section" style="padding-top:0"><div class="wrap">
    <div class="grid pillars">
      <div class="card"><h3>Dedução</h3><p class="muted">Três Inocentes e um Monstro conversam pelo mesmo chat. Só um deles está mentindo sobre quem é.</p></div>
      <div class="card"><h3>Infecção</h3><p class="muted">O Monstro tenta infectar um alvo por vez. A vítima só descobre minutos depois.</p></div>
      <div class="card"><h3>Revólver</h3><p class="muted">Duas balas, sem recarga. Nenhum tiro sai sem a autorização de outro jogador.</p></div>
      <div class="card"><h3>Jornal VHS</h3><p class="muted">Transmissões interrompem a partida com duas pistas: uma verdadeira, outra falsa.</p></div>
    </div>
    <hr class="tape">
    <div class="row" style="justify-content:space-between">
      <p class="mono" style="margin:0">Beta privado · Android · 4 jogadores</p>
      <a class="btn" href="/monstros" data-link>Ver os arquivos das entidades</a>
    </div>
  </div></section>`;
}

function about() {
  return `<section class="section"><div class="wrap">
    <p class="kicker">Sobre o jogo</p><h1>Quatro pessoas. Um Monstro.</h1>
    <div class="split" style="align-items:start">
      <div>
        <h2>Premissa</h2><p>${esc(c().aboutPremise)}</p>
        <h2>Objetivo</h2><p>${esc(c().aboutObjective)}</p>
        <h2>Experiência multiplayer</h2><p>${esc(c().aboutMultiplayer)}</p>
      </div>
      <div class="paper"><h3>COMO FUNCIONA</h3>
        <ol style="padding-left:1.2em;margin:0">
          <li>Crie uma sala privada e compartilhe o código.</li>
          <li>A partida começa sozinha quando as 4 vagas são ocupadas.</li>
          <li>Cada jogador recebe um codinome. Um deles é o Monstro.</li>
          <li>Converse no chat público e em mensagens privadas.</li>
          <li>O Monstro tenta infectar os outros sem ser descoberto.</li>
          <li>Os Inocentes usam o revólver (2 balas) para tentar eliminá-lo.</li>
          <li>Ao final, as identidades são reveladas.</li>
        </ol>
      </div>
    </div>
    <hr class="tape">
    <div class="grid">
      <div class="card"><span class="tag">Formato</span><h3 style="margin-top:10px">Chat e interface</h3><p class="muted">Sem mapa e sem movimentação. Tudo acontece na conversa.</p></div>
      <div class="card"><span class="tag">Anonimato</span><h3 style="margin-top:10px">Codinomes temporários</h3><p class="muted">Nomes reais, perfis e rankings ficam ocultos durante a partida.</p></div>
      <div class="card"><span class="tag">Plataforma</span><h3 style="margin-top:10px">Android (beta privado)</h3><p class="muted">Primeira fase com grupos fechados de 4 jogadores.</p></div>
    </div>
    <div class="row" style="margin-top:28px"><a class="btn" href="/dicas" data-link>Regras e dicas</a><a class="btn ghost" href="/monstros" data-link>Monstros</a></div>
  </div></section>`;
}

const num = (m) => String(m.id).padStart(2, "0");
const pendingCount = (m) => MONSTER_FIELDS.filter(([k]) => !m[k] && !(k === "phrase" && m.mainCondition) && !(k === "mainCondition" && m.phrase)).length;

function monsters() {
  const list = state.monsters.filter((m) => m.published);
  return `<section class="section"><div class="wrap">
    <p class="kicker">Biblioteca das entidades</p><h1>Monstros</h1>
    <p class="muted" style="max-width:44rem">Dez entidades. Cada uma infecta de um jeito diferente, e o gatilho está nas palavras da própria vítima.</p>
    <p class="notice warning">${esc(MONSTER_WARNING)}</p>
    ${
      list.length
        ? `<div class="grid photos" style="margin-top:24px">${list
            .map(
              (m) => `<a class="card monster-card" href="/monstros/${esc(m.slug)}" data-link>
          <div class="monster-img">${monsterArt(m)}</div>
          <p class="kicker" style="margin:12px 0 2px">Nº ${num(m)}</p>
          <h3>${esc(m.name)}</h3>${m.specialty ? `<div class="threat">${esc(m.specialty)}</div>` : ""}</a>`,
            )
            .join("")}</div>`
        : `<p class="muted">Nenhum registro publicado.</p>`
    }
  </div></section>`;
}

function dossier(slug) {
  const list = state.monsters.filter((x) => x.published);
  const m = list.find((x) => x.slug === slug);
  if (!m) return notFound();
  const k = list.indexOf(m);
  const prev = list[k - 1], next = list[k + 1];
  const shown = MONSTER_FIELDS.filter(([key]) => !(key === "phrase" && !m.phrase && m.mainCondition) && !(key === "mainCondition" && !m.mainCondition));
  const field = ([key, label]) =>
    m[key]
      ? key === "phrase"
        ? `<dt>${label}</dt><dd><blockquote class="phrase">“${esc(m[key])}”</blockquote></dd>`
        : `<dt>${label}</dt><dd>${esc(m[key])}</dd>`
      : `<dt>${label}</dt><dd class="pending">A definir</dd>`;
  const missing = pendingCount(m);
  return `<section class="section"><div class="wrap">
    <a href="/monstros" data-link class="mono small">← todos os Monstros</a>
    <div class="dossier" style="margin-top:18px">
      <div><div class="monster-img large">${monsterArt(m)}</div></div>
      <div class="paper">
        <p class="kicker" style="color:#7a1414">Arquivo nº ${num(m)}</p>
        <h2 style="margin-bottom:4px">${esc(m.name)}</h2>
        ${missing ? `<p class="small" style="margin:0 0 8px;color:#7a1414">Ficha incompleta: ${missing} ${missing === 1 ? "campo ainda não definido" : "campos ainda não definidos"}.</p>` : ""}
        <dl>${shown.map(field).join("")}</dl>
      </div>
    </div>
    <nav class="monster-strip" aria-label="Outros Monstros">${list
      .map((x) => `<a href="/monstros/${esc(x.slug)}" data-link title="${esc(x.name)}"${x === m ? ' aria-current="page"' : ""}>${monsterArt(x)}<span class="sr-only">${esc(x.name)}</span></a>`)
      .join("")}</nav>
    <div class="row" style="justify-content:space-between;margin-top:16px">
      ${prev ? `<a class="btn ghost small" href="/monstros/${esc(prev.slug)}" data-link>← ${esc(prev.name)}</a>` : "<span></span>"}
      ${next ? `<a class="btn ghost small" href="/monstros/${esc(next.slug)}" data-link>${esc(next.name)} →</a>` : ""}
    </div>
  </div></section>`;
}

const TIPS = [
  { id: "basicas", name: "Regras básicas", items: [
    "Cada partida tem 4 jogadores: 1 Monstro e 3 Inocentes.",
    "As salas são privadas e entram pelo código do convite. A partida começa sozinha quando a 4ª vaga é ocupada.",
    "Durante a partida, todos usam codinomes e avatares temporários. Nomes reais aparecem só depois do fim.",
    "Sair durante a partida é abandono definitivo: não dá para voltar. Uma queda de conexão não conta como abandono.",
    "Jogadores eliminados podem continuar como espectadores ou sair.",
  ]},
  { id: "infeccao", name: "Como funcionam as infecções", items: [
    "O Monstro escolhe um único alvo por tentativa, de forma secreta.",
    "A janela de validação dura cerca de 35 segundos. A infecção é confirmada se o alvo escrever uma expressão válida nesse tempo.",
    "Só contam as mensagens do alvo no chat público ou no privado com o Monstro. Privados com outros jogadores não contam.",
    "O Monstro sabe na hora. A vítima só é avisada 2 minutos depois.",
    "Cada jogador só pode ser infectado uma vez por partida. Uma tentativa que falha gera uma espera de 60 segundos.",
    "O Monstro pode fingir que também foi infectado. Essa simulação não é uma infecção real.",
    "Cada Monstro tem a sua própria condição de infecção e frase principal: veja a página Monstros.",
  ]},
  { id: "revolver", name: "Funcionamento do revólver", items: [
    "O revólver começa com 2 balas e não pode ser recarregado. Cada tiro gasta uma bala.",
    "Qualquer jogador pode pegar a arma, e todos são avisados quando isso acontece.",
    "Cada disparo exige a autorização de pelo menos outro jogador, e cada tiro precisa de uma nova autorização.",
    "Quem autoriza não escolhe o alvo. O portador escolhe e ainda pode desistir.",
    "O Monstro pode pegar a arma, mas não pode disparar.",
  ]},
  { id: "comunicacao", name: "Comunicação e chats", items: [
    "Há um chat público e conversas privadas individuais.",
    "Mensagens têm até 500 caracteres e não podem ser apagadas.",
    "Capturas de tela podem ser usadas como evidência.",
    "No beta, a comunicação é somente por texto.",
    "Transmissões do Jornal VHS trazem duas pistas sobre possíveis Monstros: uma verdadeira e uma falsa.",
  ]},
  { id: "vitoria", name: "Condições de vitória", items: [
    "Inocentes vencem quando matam o Monstro com o revólver.",
    "Inocentes também vencem se o Monstro abandonar a partida.",
    "O Monstro vence se os três Inocentes receberem infecções válidas.",
    "O Monstro vence se restarem apenas ele e um Inocente.",
    "O Monstro vence se um Inocente morrer e os outros dois estiverem realmente infectados.",
    "Uma infecção isolada não impede a vitória dos Inocentes.",
  ]},
  { id: "iniciantes", name: "Dicas para iniciantes", items: [
    "Releia o histórico: como nada pode ser apagado, contradições ficam registradas.",
    "Pense antes de autorizar um disparo. Você não escolhe o alvo, quem segura a arma escolhe.",
    "Observe quem pega o revólver. Todos são avisados, e o Monstro também pode segurá-lo.",
    "Desconfie de quem diz estar infectado: o Monstro pode simular a própria infecção.",
    "Lembre que a vítima só é avisada depois de 2 minutos. Sentir-se seguro agora não prova nada.",
    "Use o Jornal VHS com cautela: uma das duas pistas é falsa.",
  ]},
];
let tipTab = "basicas";
const tipBody = (id) => {
  const t = TIPS.find((x) => x.id === id);
  return `<div class="paper"><h3>${esc(t.name.toUpperCase())}</h3><ul style="padding-left:1.2em;margin:0">${t.items.map((x) => `<li style="margin-bottom:8px">${esc(x)}</li>`).join("")}</ul></div>`;
};
function tips() {
  return `<section class="section"><div class="wrap">
    <p class="kicker">Manual de sobrevivência</p><h1>Dicas</h1>
    <div class="tabs" role="tablist" aria-label="Categorias">${TIPS.map((t) => `<button role="tab" aria-selected="${t.id === tipTab}" data-action="tip" data-id="${t.id}">${esc(t.name)}</button>`).join("")}</div>
    <div id="tip-body" role="tabpanel">${tipBody(tipTab)}</div>
    <p class="muted small" style="margin-top:18px">Resumo das regras oficiais aprovadas. Pontos ainda em definição não aparecem aqui.</p>
  </div></section>`;
}

let shopCat = "todas";
const shopBody = () => {
  const list = state.products.filter((p) => p.visible && (shopCat === "todas" || p.category === shopCat));
  if (!list.length) return `<p class="muted">Nenhum item nesta categoria.</p>`;
  return `<div class="grid">${list
    .map(
      (p) => `<div class="card product">
      <div class="photo">${productArt(p)}</div>
      <span class="tag" style="margin-top:12px">${esc(SHOP_CATEGORIES.find((x) => x.id === p.category)?.name)}</span>
      <h3 style="margin:10px 0 6px">${esc(p.name)}</h3><p class="muted small">${esc(p.description)}</p>
      <div class="row" style="justify-content:space-between"><span class="price">${money(p.price)}</span>
      <button class="btn small" data-action="buy" data-id="${p.id}">Adquirir</button></div>
      <p class="small muted" style="margin:8px 0 0">Preço demonstrativo</p></div>`,
    )
    .join("")}</div>`;
};
function shop() {
  return `<section class="section"><div class="wrap">
    <p class="kicker">Mercado de arquivos</p><h1>Loja <span class="demo">DEMONSTRAÇÃO</span></h1>
    <p class="notice">Loja demonstrativa: preços ilustrativos e <b>nenhuma cobrança</b>. Somente itens cosméticos, sem vantagem dentro das partidas.</p>
    ${storeSections(`<div class="tabs" role="tablist" aria-label="Categorias de personalização">
      ${[{ id: "todas", name: "Todas" }, ...SHOP_CATEGORIES].map((cat) => `<button role="tab" aria-selected="${cat.id === shopCat}" data-action="shopcat" data-id="${cat.id}">${esc(cat.name)}</button>`).join("")}
    </div>
    <div id="shop-body">${shopBody()}</div>`)}
  </div></section>`;
}

function notFound() {
  return `<section class="section"><div class="wrap"><p class="kicker">Sinal perdido</p><h1>Esta fita está vazia.</h1>
    <p class="muted">A página que você procura não existe ou foi apagada.</p><a class="btn" href="/" data-link>Voltar ao início</a></div></section>`;
}

/* ============ Roteador ============ */
const PAGES = [
  { path: "/", label: "Início", view: home },
  { path: "/sobre", label: "Sobre o jogo", view: about },
  { path: "/monstros", label: "Monstros", view: monsters },
  { path: "/dicas", label: "Dicas", view: tips },
  { path: "/loja", label: "Loja", view: shop },
];
const app = document.getElementById("app");

// Rotas por hash (#/sobre): não exigem fallback do servidor, então funcionam também no Live Server.
const currentPath = () => location.hash.replace(/^#/, "").replace(/\/+$/, "") || "/";
export function navigate(path) {
  if (currentPath() === path) render();
  else location.hash = path; // dispara hashchange → render
}

function renderPublic(path) {
  const s = state.settings;
  const nav = [...PAGES.filter((p) => p.path !== "/loja" || s.showShop), ...NAV_EXTRA, accountLink()];
  const dm = path.match(/^\/monstros\/([a-z0-9-]+)$/);
  const page = dm ? { path: "/monstros", label: "Monstros", view: () => dossier(dm[1]) } : (nav.find((p) => p.path === path && p.view) ?? portalPage(path));
  app.innerHTML = `${s.maintenance ? `<div class="banner">${esc(s.maintenanceText)}</div>` : ""}
  <header class="site-header"><div class="wrap">
    <a class="brand" href="/" data-link aria-label="${esc(s.siteName)}: início">${logo()}</a>
    <button class="menu-btn" data-action="menu" aria-expanded="false" aria-controls="nav">Menu</button>
    ${soundControl()}
    <nav class="nav" id="nav" aria-label="Principal">${nav.map((p) => `<a href="${p.path}" data-link${p.path === page?.path ? ' aria-current="page"' : ""}>${p.label}</a>`).join("")}</nav>
  </div></header>
  <main class="page">${page ? page.view() : notFound()}</main>
  ${footer()}`;
  document.title = page && page.path !== "/" ? `${page.label} · ${s.siteName}` : s.siteName;
}

let clock;
function render() {
  const path = currentPath();
  document.body.classList.toggle("no-fx", !state.settings.effects);
  if (path === "/admin" || path.startsWith("/admin/")) renderAdmin(app, path);
  else renderPublic(path);
  app.querySelectorAll('a[data-link][href^="/"]').forEach((a) => a.setAttribute("href", "#" + a.getAttribute("href")));
  window.scrollTo(0, 0);
  clearInterval(clock);
  const osd = document.getElementById("osd-clock");
  if (osd) {
    const t0 = Date.now();
    clock = setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000);
      osd.textContent = `PLAY ▸ ${[s / 3600, (s / 60) % 60, s % 60].map((n) => String(Math.floor(n)).padStart(2, "0")).join(":")}`;
    }, 1000);
  }
}
export const rerender = render;

const actions = {
  menu(el) {
    const nav = document.getElementById("nav");
    const open = nav.classList.toggle("open");
    el.setAttribute("aria-expanded", String(open));
  },
  tip(el) {
    tipTab = el.dataset.id;
    document.querySelectorAll('[data-action="tip"]').forEach((b) => b.setAttribute("aria-selected", String(b === el)));
    document.getElementById("tip-body").innerHTML = tipBody(tipTab);
  },
  shopcat(el) {
    shopCat = el.dataset.id;
    document.querySelectorAll('[data-action="shopcat"]').forEach((b) => b.setAttribute("aria-selected", String(b === el)));
    document.getElementById("shop-body").innerHTML = shopBody();
  },
  buy() {
    toast("Demonstração: as compras ainda não estão disponíveis. Nenhuma cobrança foi feita.");
  },
};

document.addEventListener("click", (e) => {
  const link = e.target.closest("a[data-link]");
  if (link && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
    e.preventDefault();
    navigate(link.getAttribute("href").replace(/^#/, ""));
    return;
  }
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const fn = actions[el.dataset.action] ?? portalActions[el.dataset.action] ?? adminActions[el.dataset.action];
  if (fn) fn(el, e);
});
document.addEventListener("submit", (e) => {
  const f = e.target.closest("form[data-form]");
  if (!f) return;
  e.preventDefault();
  (portalForms[f.dataset.form] ?? adminForms[f.dataset.form])?.(f);
});
document.addEventListener("input", (e) => {
  const el = e.target.closest("[data-input]");
  if (el) (portalInputs[el.dataset.input] ?? adminInputs[el.dataset.input])?.(el);
});
window.addEventListener("hashchange", render);
history.scrollRestoration = "manual";
render();
