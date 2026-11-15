# PSICOSE — Arquitetura

> Dono: Agente 3 · Criado em 12/11/2026
> Stack aprovada em 12/11/2026 (D-20). Requisitos obrigatórios: D-21. Isolamento de integrações: D-22.

## Stack aprovada (D-20)

| Camada | Tecnologia |
|---|---|
| App (Android; iOS no futuro) | React Native + Expo + TypeScript |
| Servidor da partida | Cloudflare Workers + Durable Objects (1 sala = 1 Durable Object) |
| Salas e conexões | PartyServer (no servidor) · PartySocket (no app, com reconexão automática) |
| Autenticação | Supabase Auth. O Worker valida o JWT pelas chaves públicas (JWKS), sem chamada extra |
| Banco relacional | Supabase PostgreSQL (histórico entre partidas; ainda não usado na fase 1, P-07) |
| Erros | Sentry (app e Worker) |

```
 App Android (RN + Expo) ── login ──► Supabase Auth [projeto PSICOSE]
   │ WebSocket (PartySocket) com ?token=<JWT>
   ▼
 Worker ── valida o JWT, remove cabeçalhos forjados, injeta o id do usuário ──► Durable Object "sala <CÓDIGO>"
                                                    │ regras: packages/rules (TS puro)
                                                    │ estado + mensagens: armazenamento SQLite do DO
                                                    ▼
                                     Supabase Postgres (fases futuras)
```

## Estrutura do repositório

| Pasta | Conteúdo | Depende de |
|---|---|---|
| `packages/rules` | Regras e protocolo, em TypeScript puro e sem I/O | nada |
| `apps/server` | Worker + Durable Object da sala | `rules`, PartyServer, `jose` |
| `apps/mobile` | App Expo | `rules` (só os tipos do protocolo), PartySocket, supabase-js |

## Persistência e recuperação (D-21)

- Toda mudança de estado é **gravada no armazenamento do Durable Object antes** de ser transmitida.
  O *output gate* da Cloudflare segura as mensagens até a gravação ser confirmada.
- Ao acordar (após hibernação, deploy ou queda), a sala **recarrega o estado do armazenamento**. A memória serve só de cache.
- As mensagens ficam em chaves próprias, só de acréscimo (`msg:<seq>`). Não existe operação de apagar.
- **Reconexão:** quem já ocupa uma vaga volta para ela e recebe um *snapshot* completo, filtrado para o que pode ver.

## Eventos temporizados (D-21; ainda não usados na fase 1)

Quando a infecção, a recarga e o VHS forem implementados: fila de eventos **gravada** no armazenamento, com o alarm do
Durable Object programado para o próximo vencimento, e cada evento com um **id único**, marcado como processado
na mesma gravação que aplica o seu efeito (idempotência).

## Segurança

- O id do usuário vem **só** do JWT validado no Worker. Um cabeçalho com o mesmo nome enviado pelo cliente é descartado.
- O cliente só envia intenções. O servidor valida e devolve a cada jogador apenas o que ele pode ver
  (o próprio papel, codinomes, chat público, as próprias mensagens privadas).
- Nenhum id de conta, e-mail ou nome real de outro jogador é enviado ao app.

## Ambientes

| Ambiente | Servidor | Supabase |
|---|---|---|
| dev | `wrangler dev` local | projeto de desenvolvimento ou staging (PT-10) |
| staging | Worker `psicose-server-staging` | projeto `psicose-staging` (a criar, PT-10) |
| produção | Worker `psicose-server` | projeto `psicose-prod` (a criar, PT-10) |

Segredos ficam em `.dev.vars` ou `.env` locais (fora do controle de versão) e em `wrangler secret` na nuvem. Nunca em código.

## Como rodar (fase 1)

| Ação | Comando (na raiz) |
|---|---|
| Instalar | `npm install` (os scripts de instalação de `esbuild` e `workerd` estão aprovados em `allowScripts`) |
| Testes (regras + servidor no runtime `workerd`, sem rede) | `npm test` |
| Tipos | `npm run typecheck` |
| Servidor local | `apps/server/.dev.vars` (ver `.dev.vars.example`) → `npm run dev --workspace apps/server` |
| App | `apps/mobile/.env` (ver `.env.example`) → `npm run android --workspace apps/mobile` |

Protocolo WebSocket: `/parties/room/<CÓDIGO>?token=<JWT>`. Criar sala: `POST /rooms` com `Authorization: Bearer <JWT>`.
Tipos e códigos de fechamento em `packages/rules/src/protocol.ts`.

## Requisitos aprovados do beta (D-02 a D-10)

- App **Android** para exatamente 4 jogadores. A arquitetura precisa permitir iOS no produto final.
- Backend hospedado na internet, com comunicação em tempo real.
- Autenticação. Salas privadas por convite ou código. Sem matchmaking público.
- Mecânicas críticas validadas no servidor.
- Ambientes de teste e produção separados.
- Reinício de partidas e registro de erros.
- Base reaproveitável no produto final.

## Direção aprovada (D-17, D-18, D-19)

Jogo **só de chat e interface**, sem mapa, movimentação ou exploração de cenário.
A prioridade é um **app Android convencional** com **comunicação em tempo real** e **servidor autoritativo**.
Engine de jogos 3D descartada (R-01).

Foco técnico do beta:

- Interface da partida e painéis dos jogadores.
- Chat público e mensagens privadas.
- Eventos e notificações em tempo real.
- Infecção e temporizadores.
- Revólver, autorizações e disparos.
- Jornal VHS e interrupções.
- Estados da partida controlados pelo servidor.

**Voz (D-19):** fica fora do beta, e a comunicação é só por texto. **Não** implementar nem configurar infraestrutura de áudio.
A arquitetura deve apenas **não impedir** a inclusão futura de voz. Exemplo: as regras de autorização e intervalo de fala
podem ser adicionadas ao servidor depois, sem reescrever o modelo de partida.

## Requisitos que decorrem das regras aprovadas (`GDD.md`)

| Regra | Exigência técnica |
|---|---|
| Papéis e infecções ocultos | O estado oculto fica só no servidor. Cada cliente recebe apenas o que pode ver |
| Infecção: janela de ~35 s, recarga de 60 s, aviso à vítima após 2 min | Temporizadores controlados pelo servidor |
| Validação da expressão no chat público ou no PV com o Monstro | O servidor precisa ver as mensagens desses canais e saber em qual canal cada uma foi enviada |
| Infecção real × informação à vítima × simulação | Três estados distintos no modelo de dados |
| Mensagens que não podem ser apagadas | Histórico imutável durante a partida |
| Revólver: autorização por disparo, alvo escolhido pelo portador, Monstro não dispara | Fluxo validado no servidor, sem expor o papel |
| Notificação pública ao pegar o revólver | Eventos enviados a todos em tempo real |
| Anonimato até o fim | Separar a identidade real do codinome e não enviar dados reais durante a partida |
| Voz: pedido autorizado, no máximo 1 min, intervalo global de 5 min | **Fora do beta (D-19).** No futuro: controle do turno de voz no servidor |
| Jornal VHS | Evento de interrupção disparado pelo servidor |

## Pendências que bloqueiam a arquitetura

- **L-10:** fases/turnos × contínuo → modelo de estados e temporizadores.
- **PGD-12** (desconexão e reconexão) → afeta o modelo de estado e a persistência.

## Financeiro e afiliados (D-41, D-42) — fase F0 concluída

- `packages/finance` (TS puro, testado): demonstrativo da venda, comissão de 50% do líquido, situações (pendente, liberada, paga, estornada), ciclo de sábado (corte sexta 23:59 Brasília), atribuição vitalícia (uma vez, sem autoindicação) e código de indicação.
- O site usa uma cópia compilada (`npm run build:web --workspace packages/finance` → `apps/web/public/js/lib/finance.js`). Regenerar sempre que a regra mudar.
- Telas em demonstração: área do afiliado (`#/afiliado`), convite (`#/r/CODIGO`) e painel "Pagamentos de Afiliados". Os dados são fictícios e ficam no navegador.
- Próximas fases (F1 a F7) dependem do Supabase do PSICOSE (PT-10) e do meio de pagamento (PT-09). Na versão real, os valores são calculados só no servidor.
- Decisões pendentes: carência antes de liberar (provisório: 7 dias), impostos como dedução, estorno de comissão já paga, forma de pagamento (PIX?), regras fiscais dos afiliados e arredondamento (provisório: meio centavo para cima).
