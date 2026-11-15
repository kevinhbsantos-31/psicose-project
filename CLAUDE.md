# PSICOSE — Instruções permanentes

Jogo multiplayer de dedução social e terror psicológico.
**Meta atual:** beta privado **Android** para **exatamente 4 jogadores** (ver `docs/PROJECT_MASTER.md`).
Este arquivo contém só regras permanentes. A fonte da verdade do projeto é `docs/`. Não duplique documentação aqui.

## Diretriz principal

**Máxima qualidade com o mínimo de créditos Claude**, sem sacrificar qualidade, segurança ou consistência.

- Não reler arquivos já lidos na sessão; ler só o trecho necessário.
- Não refazer trabalho concluído nem reabrir decisões aprovadas.
- Leitura ampla ou busca em muitos arquivos → `context-optimizer:scout`.
  Testes, builds e logs longos → `context-optimizer:runner`. Um arquivo ou uma busca → direto.
- Reutilizar Skills e ferramentas listadas em `docs/SKILLS.md`.
  Não criar agentes, Skills, plugins ou configurações sem ganho comprovado.
- Relatórios curtos: o que mudou, o que falta, o que precisa de decisão.

## Idioma

Toda comunicação, documentação, relatórios e explicações em **português brasileiro**.
Comandos, nomes de arquivos, bibliotecas, funções, variáveis e APIs ficam na forma técnica original.

## Autoridade e decisões

- O **proprietário** é a autoridade final.
- O **Orquestrador Master** coordena os agentes, mas não altera decisões aprovadas.
- Só vale como decisão o que estiver **Aprovado** em `docs/DECISIONS.md`. Sugestão não é decisão.
- Nunca inventar regra de jogo, conteúdo, decisão técnica ou responsabilidade de agente não aprovada.
- Conflito entre agentes, prompts ou documentos → registrar em `docs/DECISIONS.md` como pendência e
  apresentar ao proprietário: problema, alternativas e impactos.

## Agentes (instruções em `docs/agents/`)

| Agente | Responsabilidade principal |
|---|---|
| Orquestrador Master | Coordenação, documentação, dependências, integração, Skills, controle de decisões |
| 1 — Game Design e Balanceamento | GDD, regras, mecânicas, fluxo, estados, equilíbrio, vitória, especificações |
| 2 — Monstros e Narrativa | 10 Monstros iniciais, habilidades, mitologia, expressões de infecção, Biblioteca |
| 3 — Arquitetura e Backend | Arquitetura, banco, autenticação, servidor multiplayer, APIs, tempo real, segurança, implantação |
| 4 — Design, UX/UI e Frontend | Identidade visual, UX, interface, navegação, site e app Android |
| 5 — Economia, Progressão e Monetização | XP, níveis, rating, rankings, loja, cosméticos, pagamentos, eventos — **sem pay-to-win** |
| 6 — QA, Testes e Segurança | Testes funcionais e de integração, auditoria de segurança, desempenho, validação do beta |

Nenhum agente assume a responsabilidade principal de outro.

**Fluxo de autoridade:** Game Design especifica → Monstros propõe conteúdo e Game Design avalia o equilíbrio →
Backend implementa e valida no servidor → Frontend apresenta → QA verifica → Orquestrador integra.

## Princípios técnicos aprovados

- Mecânicas críticas são validadas **no servidor**. O cliente nunca é a fonte da verdade.
- Construir uma **base real e evolutiva**, não um protótipo descartável. Ela deve ser reaproveitável no produto final (Android + iOS).
- Ambiente de **testes separado** do de **produção**.
- **Stack aprovada (D-20):** RN + Expo + TS · Cloudflare Workers + Durable Objects + PartyServer/PartySocket ·
  Supabase Auth + Postgres · Sentry. Detalhes e requisitos obrigatórios (D-21) em `docs/architecture/README.md`.
- Estado essencial sempre persistido; handlers de alarm idempotentes; regras em `packages/rules` (TS puro).

## Isolamento de integrações (D-22)

- **Proibido** acessar, consultar, alterar ou reutilizar recursos do outro projeto do proprietário (Supabase, Cloudflare, Vercel).
- **Não usar o conector `claude.ai Supabase`** (enxerga a conta inteira) até existir um MCP restrito ao projeto PSICOSE.
- Credenciais, bancos e configurações exclusivos do PSICOSE. Criar recursos na nuvem só com autorização.

## Fluxo de trabalho

- Propor antes de mudanças estruturais e aguardar aprovação do proprietário.
- Alterar só os arquivos do escopo da tarefa.
- Nada de commit ou push sem pedido explícito.
- Ao concluir uma tarefa, atualizar o documento responsável (GDD, DECISIONS, architecture, QA).
  O `CLAUDE.md` só muda quando surgir uma nova regra permanente.
- Among Us e Town of Salem são referências **apenas conceituais**. Mecânicas e conteúdo são próprios.

## Mapa da documentação

| Arquivo | Conteúdo | Dono |
|---|---|---|
| `docs/PROJECT_MASTER.md` | Visão geral, beta, requisitos centrais | Orquestrador |
| `docs/GDD.md` | Regras e mecânicas | Agente 1 |
| `docs/DECISIONS.md` | Decisões aprovadas, hipóteses, pendências, lacunas | Orquestrador |
| `docs/agents/` | Instruções dos 7 agentes | Orquestrador |
| `docs/architecture/` | Documentação técnica | Agente 3 |
| `docs/QA/` | Plano de testes e registro de falhas | Agente 6 |
| `docs/SKILLS.md` | Skills e ferramentas por agente | Orquestrador |
| `docs/MONSTROS.md` | Biblioteca dos 10 Monstros (cards oficiais, D-37) e pendências | Agente 2 |
| `docs/PROGRESSAO.md` | XP, níveis, skins, inventário, desbloqueios, matchmaking, tela de resultado (D-45) | Agente 5 |
| `docs/INFECCAO.md` | Motor Universal de Infecção e regras de infecção dos 10 Monstros (D-43, D-44) | Agentes 1 e 3 |
| `docs/design/IDENTIDADE_VISUAL.md` | Logotipo oficial (sem alterações), paleta, tipografia (D-36) | Agente 4 |
| `docs/design/IDENTIDADE_SENSORIAL.md` | Identidade sonora, licenças de áudio (D-32 a D-34) | Agente 4 |

## Fase atual

Fase 1 (fundação): `packages/rules`, `apps/server`, `apps/mobile`. Comandos na raiz: `npm test`, `npm run typecheck`.
