# Progressão, XP, níveis, skins e recompensas — especificação

**Status:** proposta para aprovação. **Nada implementado.** Dono: Agente 5 (economia e progressão), com o Agente 3 (servidor
e banco) e o Agente 4 (telas). Pendências que este documento responde: PGD-11 (XP e rating) e PGD-15 (bônus do aleatório).

Legenda: **[A]** diretriz do proprietário (D-45) · **[P]** proposta com valores ajustáveis · **[Q]** decisão do proprietário (§10).

Princípios que não mudam: **sem pay-to-win** (D-13, D-39); servidor autoritativo; **uma loja só, no site** (pagamento
demonstrativo até a PT-09); anonimato durante a partida (GDD §8).

---

## 1. Skins e inventário visual

- **[A]** Ao criar a conta, o jogador escolhe uma de duas **skins básicas gratuitas**: masculina ou feminina. **[P]** Pode
  trocar depois, sem custo.
- **[A]** Skins adicionais são vendidas **na loja do site**, todas dentro da temática (terror psicológico, VHS, investigação,
  sobrenatural, universo de Itaverá). Novas skins podem chegar em eventos e campanhas. Sem preços nem tabela fixa aqui.
- **[A]** As skins também podem ser liberadas por **nível** (§5).
- Skin é **cosmética**: não muda nada na partida (D-13).
- **Equipar:** `perfil.skinEquipada` é validada no servidor contra o inventário. Uma skin que o jogador não possui é rejeitada.
- **[Q-P1] Onde a skin aparece:** o GDD §8 manda usar **avatares temporários** durante a partida e proíbe ver perfis e
  insígnias. Uma skin rara identificaria o jogador. **[P]** A skin aparece no perfil, no site, na tela de resultado e na
  sala de espera pós-partida. Durante a partida, todos continuam com avatar temporário.

## 2. Inventário único (Monstros, skins, documentos e itens)

Uma tabela só para tudo o que o jogador possui. Ela é a mesma usada por "Meus Monstros" (D-38) e não cria inventário
paralelo.

```
inventario(userId, tipo: monstro|skin|documento|item, itemId, origem: inicial|compra|evento|nivel,
           origemRef (compraId|eventoId|nível), obtidoEm)  único (userId, tipo, itemId)
catalogo(itemId, tipo, nivelParaComprar?, nivelParaUsar?, disponivel, eventoId?)
```

- **[A]** Cada jogador recebe **3 Monstros iniciais aleatórios** ao entrar. Outros vêm da loja, de eventos e campanhas
  e, agora, do nível.
- **[A]** Hoje as insígnias de origem são **inicial**, **comprado** e **evento/campanha**. **[Q-P2]** Criar a 4ª,
  **progressão**.
- **Concessões só no servidor** e **idempotentes** pela chave única. Repetir a mesma compra, recompensa de nível ou
  evento nunca duplica. Se o item já existe por outra origem, a concessão é ignorada [Q-P3: o jogador recebe algo em troca?].
- **Loja e app compartilham o mesmo banco** (Supabase, após a PT-10). O jogador lê só o próprio inventário (RLS).
  Compra, nível e evento gravam pelo servidor, nunca pelo navegador ou pelo app.
- **Requisito de nível:** um item com `nivelParaComprar` não pode ser comprado abaixo do nível (o servidor recusa antes
  do pagamento). Um item com `nivelParaUsar` pode ficar guardado, mas só pode ser equipado ao atingir o nível. **[P]**
  Usar só `nivelParaComprar` no começo (mais simples e não vende algo que não se pode usar).
- **Monstros (D-39):** possuir um Monstro só permite escolhê-lo como preferido. O sorteio de quem é Monstro não muda.

## 3. Tela de resultado [A]

| Quem venceu | Mostra |
|---|---|
| **Monstro** | Nome do vencedor + skin + **Monstro usado na partida** |
| **Inocente que matou o Monstro** | Nome do vencedor + skin. **Nenhum Monstro** ligado a ele |

- **Sem vazamento antecipado:** o servidor só monta e envia os dados do resultado (nomes reais, skins, Monstro) **depois**
  do fim da partida. Durante a partida, o app não recebe esses dados. Os nomes são revelados só no fim (GDD §8).
- **[Q-P4] Quem é "o vencedor" quando os Inocentes vencem:** a vitória é da equipe (GDD §3). Proposta: o destaque vai
  para **quem disparou** o tiro que matou o Monstro, e os demais Inocentes aparecem como "vencedores" menores. Faltam
  dois casos: (a) Inocentes infectados contam como vencedores? (b) Vitória por abandono do Monstro (D-31), em que
  ninguém atirou: destaque para a equipe, sem atirador.

## 4. XP e níveis [P] (resolve PGD-11 se aprovado)

### 4.1 XP por partida (só o servidor calcula, no fim da partida)

| Evento | XP |
|---|---|
| Partida concluída (participação) | 100 |
| Vitória (equipe ou Monstro) | +50 |
| Monstro: cada infecção válida | +20 (máx. 3) |
| Inocente: disparo que matou o Monstro | +40 |
| Inocente: autorizou esse disparo | +20 |
| Primeira partida do dia | +50 |
| Monstro aleatório em vez de preferido (PGD-15) | +10% do total |
| Derrota | sem penalidade (só os 100 de participação) |

Uma partida rende **de 100 a 260 XP** (por volta de 170 em média). Perder ainda progride, mas vencer e jogar bem rendem mais. Matar um
Inocente não tira XP (a penalidade fica no rating, §6).

### 4.2 Contra exploração ("farm")

- XP **zero** para quem abandonou (D-29 distingue abandono de queda), em partida com menos de **3 min** ou se o jogador
  não teve nenhuma ação (nenhuma mensagem e nenhum evento).
- **Salas privadas** (o beta é só por código, GDD §2): **[Q-P5]** dão XP? Proposta: dão XP, mas **não** contam para
  rankings nem rating, e a mesma formação de 4 contas rende XP reduzido depois de 5 partidas no mesmo dia.
- Gravação idempotente por `(partidaId, userId)`.

### 4.3 Curva de níveis

XP para passar do nível *n* para o *n+1* = **300 + 50·n**. **Nível máximo: 50.** Depois do 50, **[Q-P6]** temporadas
ou prestígio.

| Marco | XP acumulado | Partidas (cerca de 170 XP por partida) |
|---|---|---|
| Nível 2 | 350 | 2 |
| Nível 5 | 1.700 | 10 |
| Nível 10 | 4.950 | 29 |
| Nível 25 | 22.200 | 130 |
| Nível 50 | 75.950 | 450 |

Assim os primeiros níveis passam rápido (o jogador sente que avança) e o nível 50 vira meta de longo prazo. Registro no
servidor: `perfil.xp` e `perfil.nivel`, mais um `xp_historico(partidaId, userId, motivo, valor)` para auditoria. O nível
é calculado a partir do XP total, sem acumular erro.

## 5. Desbloqueios por nível [P]

Pequenos a cada nível e marcantes a cada 5 níveis, para que cada desbloqueio tenha significado no universo do jogo:

| Nível | Recompensa |
|---|---|
| Todo nível | Fragmento do **Arquivo** (trecho narrativo curto) ou moldura/título de perfil |
| 5, 15, 25, 35, 45 | **1 Monstro** que o jogador ainda não tem, **à escolha dele** (origem: progressão) |
| 10, 20, 30, 40 | **Skin** exclusiva de progressão |
| 50 | Skin e título "Faroleiro de Ponta Escura" |

Com 3 Monstros iniciais e mais 5 por nível, o jogador chega a 8 só jogando. Os outros 2 vêm da loja ou de eventos, o que
mantém a coleção como objetivo. **[Q-P7]** Aprovar a tabela.

- **Itens da loja com nível:** marcados com `nivelParaComprar`. O site mostra "Disponível no nível N".
- **Eventos [P]:** eventos gerais ficam abertos a todos. Só **capítulos extras** de um evento exigem nível (por exemplo,
  nível 10 ou mais), para não excluir iniciantes.
- **Rankings:** as regras da PGD-13 não mudam. O nível só controla **a entrada nas categorias**: o mínimo de 5 partidas
  já existe; **[P]** acrescentar nível 5 ou mais para aparecer no ranking geral. Não existe "divisão por nível", porque
  nível mede tempo de jogo e não habilidade (§6).

## 6. Matchmaking [P] (pós-beta; o beta usa sala privada por código)

- **Nível não basta:** ele mede quanto o jogador já jogou. Proposta: um **rating oculto** (Elo simples por papel: Monstro
  e Inocente) para equilibrar, com o nível usado só para proteger **iniciantes**.
- **Fila (um Durable Object "Matchmaker"):**
  1. Jogadores com menos de 10 partidas jogam entre si, quando houver gente suficiente.
  2. Começa com rating ±100. A faixa cresce a cada 15 s (±200, ±400) e, depois de **90 s**, aceita qualquer rating.
  3. Forma a sala assim que houver **4** compatíveis.
- Os números são de partida e devem ser ajustados com dados reais de fila.

## 7. Integração com a loja do site

Fluxo de compra (quando a PT-09 for decidida): o site chama o servidor, que confere o nível e se o jogador já possui o
item, registra a compra e grava no inventário (`origem=compra`, `origemRef=compraId`). O app lê o inventário ao abrir e
ao voltar de segundo plano. **Não haverá loja no app** (ou, no Android, apenas um link, conforme as regras do Google Play:
ver PT-09). Hoje o site é só uma demonstração com `localStorage`. A migração acontece junto com o Supabase (PT-10).

## 8. Objetivos de curto, médio e longo prazo

- **Curto (1 sessão):** XP da partida, bônus da primeira partida do dia, fragmentos do Arquivo.
- **Médio (semanas):** Monstros a cada 5 níveis, skins a cada 10, posição nos rankings.
- **Longo (meses):** coleção completa (10 Monstros, skins, Arquivo), nível 50, eventos e temporadas (Q-P6).

## 9. Testes de consistência

1. Conta nova → escolhe a skin básica e recebe 3 Monstros iniciais diferentes, com origem `inicial`.
2. Equipar uma skin que não possui → recusado pelo servidor.
3. Repetir a concessão de compra, nível ou evento → inventário inalterado (idempotente).
4. Item que já existe recebido por outra origem → não duplica (Q-P3).
5. Comprar item com `nivelParaComprar` acima do nível do jogador → recusado antes do pagamento.
6. Monstro vence → tela mostra nome, skin e Monstro. Inocente vence pelo disparo → nome e skin, **sem** Monstro.
7. Durante a partida, o app não recebe nome real, skin nem Monstro dos outros (verificar as mensagens do protocolo).
8. Abandono, partida com menos de 3 min ou jogador sem nenhuma ação → 0 XP. Partida gravada 2× → XP gravado 1×.
9. XP exato na fronteira do nível → sobe; 1 XP a menos → não sobe; no nível 50, o XP não passa do limite.
10. Nível 5 → escolhe 1 Monstro que ainda não tem; não pode escolher um que já possui.
11. Fila: 4 iniciantes → sala formada; jogadores de rating distante → só se juntam depois de a faixa crescer.
12. Comprar um Monstro não muda o sorteio de papéis (D-39).

## 10. Decisões do proprietário

| Id | Questão | Recomendação |
|---|---|---|
| Q-P1 | Skin visível durante a partida quebra o anonimato (GDD §8) | Só fora da partida e na tela de resultado |
| Q-P2 | Insígnia de origem "progressão" | Criar |
| Q-P3 | O jogador ganha um item que já possui | Converter em fragmento extra do Arquivo (sem moeda nova) |
| Q-P4 | Quem é o "vencedor" quando os Inocentes vencem; infectados; vitória por abandono | Destaque para o atirador e a equipe listada; infectados contam como Inocentes se o GDD não disser o contrário (confirmar) |
| Q-P5 | Salas privadas dão XP e contam para ranking? | XP sim (com limite); ranking e rating não |
| Q-P6 | Depois do nível 50 | Temporadas, em decisão futura |
| Q-P7 | Tabelas de XP (§4.1), curva (§4.3) e desbloqueios (§5) | Aprovar como v1 e ajustar no beta |
| Q-P8 | Rating oculto para o matchmaking (além do nível) | Sim, Elo simples por papel |
| Q-P9 | Requisito de nível para comprar e/ou usar itens | Começar só com "para comprar" |
