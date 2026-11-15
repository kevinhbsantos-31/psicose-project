# PSICOSE — Documento Mestre

> Dono: Orquestrador Master · Criado em 12/11/2026
> Decisões detalhadas e pendências: `DECISIONS.md` · Regras do jogo: `GDD.md`

## Visão

O PSICOSE é um jogo multiplayer de dedução social e terror psicológico. Ele tem referências conceituais a
Among Us e Town of Salem, mas mecânicas próprias.

**Objetivo final:** um jogo multiplayer completo, seguro, consistente, escalável e comercialmente viável.

## Primeiro produto: beta privado

| Item | Definição |
|---|---|
| Jogadores | Exatamente 4: o proprietário e 3 convidados |
| Plataforma | **Exclusivamente Android** |
| Fluxo | Instalar o app → autenticar → entrar numa sala privada pela internet → jogar com os outros 3 |
| Modo de jogo | 1 Monstro × 3 Inocentes |
| Formato | Só chat e interface, sem mapa, movimentação ou exploração de cenário. App Android convencional + tempo real + servidor autoritativo |
| Comunicação | **Somente texto:** chat público e mensagens privadas. Voz fora do beta (D-19) |

### Requisitos confirmados do beta

- Backend hospedado na internet.
- Comunicação multiplayer em tempo real.
- Autenticação dos participantes.
- Salas privadas por convite ou código.
- Validação das mecânicas críticas no servidor.
- Sem matchmaking público.
- Ambiente de testes separado do de produção.
- Possibilidade de reiniciar partidas e registrar erros.
- Arquitetura reaproveitável no produto final.

### Princípio de construção

Não desenvolver um protótipo descartável se for possível construir uma base real e evolutiva.

## Produto final

- Expansão para **Android e iOS**.
- Voz modificada (regras no `GDD.md`, seção 6).
- Economia, progressão e monetização **sem pay-to-win** (Agente 5).
- Lançamento público (matchmaking e escala ainda não especificados).

## Conceito central (resumo; regras completas em `GDD.md`)

- **Inocentes** vencem só matando o Monstro com o revólver (2 balas, disparo com autorização de outro jogador).
- **Monstro** vence pela infecção dos Inocentes. A infecção é confirmada quando o alvo escreve uma expressão válida dentro de uma janela de cerca de 35 s.
- Chat público e mensagens privadas que não podem ser apagadas. Voz modificada prevista **para depois do beta**.
- **Jornal VHS:** interrupções com uma pista verdadeira e uma falsa.
- **Anonimato total** durante a partida: codinomes e avatares temporários.

## Organização

Um Orquestrador Master e seis agentes especializados (ver `agents/`). O proprietário é a autoridade final.

## Estado atual

| Área | Estado |
|---|---|
| Documentação | Organização inicial concluída (12/11/2026) |
| Game design | Regras centrais aprovadas; pendências e lacunas em `DECISIONS.md` |
| Stack técnica | **Aprovada** (D-20): RN + Expo · Cloudflare Workers + DO + PartyServer · Supabase · Sentry |
| Código | Fase 1 em implementação (fundação: login, salas, lobby, papéis, chat, reconexão) |
