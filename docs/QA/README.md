# PSICOSE — QA

> Dono: Agente 6 · Criado em 12/11/2026
> O plano detalhado depende da stack e das especificações. Aqui fica só o escopo inicial e o registro de falhas.

## Escopo de validação do beta

1. Os 4 jogadores instalam o app Android, se autenticam e entram na mesma sala privada pela internet.
2. Uma partida completa termina em cada uma das condições de vitória do `GDD.md`.
3. As mecânicas críticas são recusadas pelo servidor quando são inválidas.
4. Nenhuma informação oculta e nenhuma identidade real chega a quem não pode vê-la.
5. É possível reiniciar a partida, e os erros ficam registrados.

**Fora do escopo de testes do beta:** voz (D-19). Comunicação só por texto. Jogo só de chat e interface (D-17).

## Cenários críticos (derivados das regras aprovadas)

- Monstro tenta disparar → bloqueado, sem revelar o papel.
- Disparo sem autorização, ou reaproveitando uma autorização anterior → recusado.
- Terceira tentativa de disparo → recusada (só existem 2 balas, sem recarga).
- Expressão válida no PV com um terceiro → **não** infecta. No chat público ou no PV com o Monstro → infecta.
- Expressão enviada fora da janela de ~35 s → não infecta. Tentativa fracassada → recarga de 60 s.
- Alvo já infectado → não pode ser infectado de novo.
- A vítima é notificada 2 min depois da confirmação. O Monstro é notificado na hora.
- A auto-infecção simulada não conta para as condições de vitória.
- As mensagens não podem ser apagadas.
- Uma mensagem privada chega só ao destinatário e ao remetente, e nunca aparece no chat público.
- O app não pede permissão de microfone nem mostra controles de voz.

## Cobertura automatizada (fase 1, 12/11/2026)

| Suíte | Testes | O que garante |
|---|---|---|
| `packages/rules/test` | 17 | Lobby de 4 vagas, abandono, D-31 (Monstro abandona), sorteio de 1 Monstro e 3 Inocentes, codinomes únicos, chat e mensagem privada, visão filtrada sem ids de conta, protocolo |
| `apps/server/test` | 10 | D-31 (queda do Monstro não encerra; abandono dá vitória aos Inocentes), limite de 500 caracteres no servidor, JWT inválido ou forjado recusado, cabeçalho de usuário forjado ignorado, início automático com o 4º jogador, 5º recusado, abandono definitivo durante a partida, papéis secretos, mensagem privada só às duas partes, **recuperação após despejo do Durable Object**, reconexão que substitui a conexão antiga, saída do lobby |

Ainda sem teste automatizado: o app no aparelho (precisa do Supabase do PSICOSE) e fluxos de ponta a ponta com Maestro.

## Registro de falhas

| ID | Data | Área / agente | Descrição | Severidade | Status |
|---|---|---|---|---|---|
| — | — | — | Nenhuma falha registrada | — | — |
