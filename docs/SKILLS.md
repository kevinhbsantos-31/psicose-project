# PSICOSE — Skills e Ferramentas

> Dono: Orquestrador Master · Inventário de 12/11/2026
> Regra: reutilizar o que já está instalado. Não instalar nem criar Skills sem ganho demonstrável.
> Skills que dependem da stack (ex.: padrões de um framework específico) só entram depois da decisão em `DECISIONS.md`.

## Uso geral (todos os agentes)

| Recurso | Uso |
|---|---|
| `context-optimizer:scout` (agente) | Leitura ampla e buscas em vários arquivos, com menor custo |
| `context-optimizer:runner` (agente) | Testes, builds e logs longos, devolvendo só o resumo |
| `context-optimizer:cco` | Custo e tamanho do contexto da sessão |
| `ponytail` (ativo) | Mudança mínima e completa; evita código desnecessário |

## Por agente

| Agente | Skills / agentes instalados relevantes |
|---|---|
| Orquestrador | `ecc:plan`, `ecc:architecture-decision-records`, `engineering:documentation` |
| 1 — Game Design | `playtesting:playtest` + agente `playtesting:playtest-coordinator` (balanceamento, métricas, A/B), `game-architecture:game-arch-patterns` (estados de jogo) |
| 2 — Monstros e Narrativa | Nenhuma Skill específica instalada. `localization:localize` só se houver localização das expressões de infecção |
| 3 — Arquitetura e Backend | `multiplayer-networking:multiplayer` + agente `multiplayer-networking:network-engineer`, `game-architecture:game-arch` + agente `game-architecture:game-architect`, `save-systems:save-system` (persistência e reconexão), `engineering:system-design`, `ecc:api-design`, `ecc:backend-patterns`, `ecc:security-review`, `ecc:deployment-patterns`, agente `ecc:database-reviewer` |
| 4 — Design, UX/UI e Frontend | `ui-game-design:game-ui` + agente `ui-game-design:game-ui-designer`, `design:design-system`, `design:design-critique`, `design:ux-copy`, `design:accessibility-review`, `audio-systems:game-audio` (ambientação de terror), `performance-optimization:game-perf` (dispositivos Android) |
| 5 — Economia e Monetização | `monetization-ethics:monetize` + agente `monetization-ethics:monetization-advisor` (checklist de dark patterns, coerente com "sem pay-to-win") |
| 6 — QA, Testes e Segurança | `playtesting:playtest`, `engineering:testing-strategy`, `ecc:tdd-workflow`, `ecc:e2e-testing`, `ecc:verification-loop`, agente `ecc:security-reviewer`, `performance-optimization:game-perf` |

## Da stack aprovada (D-20)

- App: `ecc:react-native-patterns`, `ecc:typescript-patterns`, `ecc:react-review`.
- Servidor: `ecc:typescript-patterns`, `ecc:security-review`, `ecc:backend-patterns`. `ecc:postgres-patterns` e o agente `ecc:database-reviewer` quando o Postgres entrar.
- **MCP Supabase:** o conector global `claude.ai Supabase` está **proibido** (D-22). Usar só um MCP restrito
  (`https://mcp.supabase.com/mcp?project_ref=<ref-psicose>`) depois que o projeto existir e com autorização.
- `wrangler` e `supabase` (CLIs): via dependência do projeto ou `npx`, sem instalação global.

## Observações do ambiente

- **ECC** v2.2.3 instalado no escopo local. Os hooks estão ativos (GateGuard pede fatos antes do primeiro comando de shell).
  A reconfiguração está bloqueada por uma divergência na origem do marketplace (`affaan-m/everything-claude-code` × `affaan-m/ECC`).
  Foi mantida assim por decisão do proprietário.
- Servidores MCP `desktop-commander` e `definite` falharam ao conectar. Não são necessários para o projeto.
- Skills próprias do projeto: **nenhuma**. Criar somente quando houver ganho demonstrável.
