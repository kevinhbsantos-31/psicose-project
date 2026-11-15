# Sistema de Infecção dos 10 Monstros — especificação consolidada

**Status:** especificações individuais **aprovadas pelo proprietário** (D-43, D-44). **Implementação não autorizada ainda.**
Dono: Agente 1 (regras) e Agente 3 (motor). Substitui as condições de infecção e o "Motor de detecção comum" da
*Proposta de design v1* em `MONSTROS.md` (lá ficam a narrativa e a origem dos Monstros).

Legenda: **[A]** aprovado pelo proprietário · **[R]** recomendação técnica (não é regra) · **[Q]** questão em aberto (§6).

---

## 1. Regras universais [A]

- O Monstro escolhe um alvo e aciona **INFECTAR**. O servidor abre a observação no seu relógio (o relógio do aparelho não vale).
- Só contam ações e mensagens **do alvo**, feitas **depois** da abertura. Mensagens de terceiros ou do Monstro nunca contam.
- Sucesso: o Monstro é avisado **na hora**; a vítima, **2 min** depois. Cada jogador só é infectado **uma vez**.
- Tentativa fracassada: **cooldown de 60 s**.
- A simulação de auto-infecção do Monstro não é infecção real (GDD §5).
- **Liberdade estratégica:** o motor avalia **só a condição** do Monstro. Ele nunca exige roteiro, frase ou estratégia
  cadastrada e nunca julga se a estratégia foi boa. Os exemplos das especificações são ilustrações.
- O servidor valida, persiste e é idempotente: eventos com id único e alarmes que podem repetir sem efeito duplo.
- Nada fora do app é observado (microfone, câmera, outros apps).
- **Desconexão não é comportamento:** queda ou app em segundo plano não podem gerar sucesso por omissão.
- Cada Monstro define a própria janela, os próprios canais e a quantidade de tentativas (D-43). O padrão de 35 s vale
  só onde a especificação diz.

## 2. Motor Universal de Infecção [A] (estrutura técnica [R])

Um motor só, com três modalidades. Cada Monstro é **uma regra configurada** e não um sistema próprio.

| Modalidade | Avalia | Usado por |
|---|---|---|
| Expressão | Significado das mensagens (com isca) ou palavra exata | Concordante, Contestador, Socorro, Delator, Confidente, Eco |
| Comportamento | Eventos objetivos registrados no servidor | Silencioso, Reflexo, Anfitrião |
| Híbrida | Expressão e comportamento combinados | Observador |

**Sistema Universal de Iscas [A]:** o Monstro marca uma **mensagem própria** como ISCA, escolhe o alvo e aciona INFECTAR.
A isca fica presa à tentativa e ao alvo. O limiar inicial de **75%** vale sempre **junto com a análise de intenção**
(negação, contradição, ironia, citação, hipótese) e **nunca sozinho**. Ele não se aplica a regras puramente comportamentais.

### 2.1 Peças compartilhadas [R]

- **Registro de eventos** (no Durable Object da sala): `{id, seq, at (servidor), playerId, type, channel (publico|pv),
  peerId?, messageId?, data}`. Tipos já existentes ou previstos: `msg`, `revolver_pegar`, `revolver_autorizar`,
  `revolver_disparar`, `pv_abrir`, `conexao`. Novos tipos entram só quando a função existir no jogo (CF-06).
- **Tentativa:** `{id, monsterRule, targetId, baitRef?, openedAt, endsAt?, status: ativa|sucesso|falha|anulada, progress}`,
  persistida, com o fim controlado por um **alarm** idempotente.
- **Regra do Monstro:** `{modalidade, isca: nenhuma|mensagem-propria|palavra-da-vitima|captura, janela (ms|null),
  maxAtivas, canaisIsca, canaisEvidencia, avaliar(tentativa, evento) → progresso|sucesso|nada, aoExpirar → falha|sucesso}`.
- **Avaliadores reutilizáveis:** `semantico(intencao)`, `lexico(palavra, n)`, `ausencia(tipos, duração)`,
  `primeiraMensagem(peer)`, `similaridade(captura)`, `livro(itens, meta)`.
- **Classificador semântico** atrás de uma interface (`classificar(isca, mensagem, intencao) → {pontuacao, flags}`), para
  trocar de mecanismo sem mexer nas regras (§5).
- **Regras puras em `packages/rules`** (TS e testes). O servidor (`apps/server/src/room.ts`) só registra eventos,
  chama o motor e persiste.

## 3. Catálogo das 10 regras [A]

| # | Monstro | Modalidade | Isca | Janela | Canal da evidência | Condição |
|---|---|---|---|---|---|---|
| 1 | Concordante | Expressão | Mensagem própria | 35 s | Público; com o Monstro [Q-04] | Concordar com a ideia central da isca |
| 2 | Contestador | Expressão | Mensagem própria | 35 s | Público; com o Monstro | Contestar a ideia central da isca |
| 3 | Silencioso | Comportamento | Mensagem própria no público (contexto) | 80 s | — (ausência) | Nenhuma interação pública nos 80 s completos |
| 4 | Socorro | Expressão | Mensagem própria | 35 s | Público ou PV com o Monstro | Pedido genuíno de ajuda ligado à isca |
| 5 | Delator | Expressão | Própria, no público ou no PV com a vítima | 35 s | **Só público** | Acusar publicamente qualquer outro jogador |
| 6 | Confidente | Expressão | Própria, no público ou no PV | 35 s | **Só PV com o Monstro** | Concordar com a ideia central da isca |
| 7 | Eco | Expressão lexical | Substantivo escrito pela vítima | **Sem limite** | Qualquer canal | Escrever a palavra exata 4 vezes |
| 8 | Reflexo | Comportamento | Captura MONTAR ISCA | 50 s | Qualquer canal | Similaridade comportamental **> 75%** |
| 9 | Anfitrião | Comportamento | Nenhuma | 25 s | PV com o Monstro | A vítima inicia a conversa no PV do Monstro |
| 10 | Observador | Híbrida | Nenhuma (seleção da vítima) | **Sem limite** | Qualquer canal | 10 dos 30 itens do Livro de Registros |

### 3.1 O Concordante — expressão
- **Válido:** concordância direta ou indireta, ao grupo ou ao Monstro, reformulada ou parcial, desde que apoie a ideia
  central. Exemplo oficial: na isca "Precisamos nos acalmar…, não é, João?", João responde "Sim, mano, a galera está
  geral perdendo a cabeça. Vamos parar de briga" → infecção.
- **Inválido:** negar, discordar, citar sem apoiar, relatar a opinião de terceiros, ou usar as mesmas palavras com
  intenção contrária.

### 3.2 O Contestador — expressão
- **Válido:** discordância, negação, argumento contrário, pergunta que rejeita, correção ou contradição indireta.
  Exemplo oficial: na isca "Eu sou o Monstro Contestador…", a resposta "Isso é mentira, você não é o Monstro" → infecção.
  O motor não julga se a isca era absurda.
- **Inválido:** assunto diferente, pergunta neutra, citação sem oposição, concordância parcial, ou só acrescentar informação.
- **[R]** Em mensagens com várias ideias, vale a relação com a **ideia central** da isca.

### 3.3 O Silencioso — comportamento
- **Fluxo:** isca no chat público → INFECTAR → 80 s. **Sucesso ao fim** dos 80 s se a vítima não teve **nenhuma**
  interação pública. Qualquer interação pública → falha imediata. Mensagens no PV não quebram o silêncio.
- **Quebram o silêncio:** mensagem pública; ações públicas existentes no jogo (pegar o revólver, autorizar ou disparar).
  Voz e votações ainda não existem no jogo (CF-06).
- **Desconexão:** a vítima precisa estar conectada durante os 80 s inteiros [Q-01].

### 3.4 O Socorro — expressão
- **Válido:** pedido real de ajuda, apoio, proteção, orientação ou colaboração **ligado à isca**, feito ao grupo (com o
  Monstro entre os participantes) ou no PV com o Monstro. Exemplos oficiais: Rafael pede ao grupo "Alguém pode me ajudar
  a investigar?"; no PV, "vou precisar da sua ajuda" → infecção.
- **Inválido:** só mencionar "ajuda", pedido hipotético, ironia, pergunta sem pedido, pedido sem relação com a isca, PV
  com terceiros, ou pedido no público dirigido só a outro jogador [Q-02].

### 3.5 O Delator — expressão
- **Válido:** acusação **pública** contra **qualquer** outro jogador, citado ou não na isca. Os dois exemplos oficiais
  (acusar Leonardo; acusar Pedro em vez de Leonardo) → infecção.
- **Inválido:** acusação só no PV, pergunta neutra, apenas citar um nome, relatar a acusação de outra pessoa, discutir
  hipóteses sem apontar ninguém, ironia ou brincadeira.
- **[R]** Os 75% medem a **intenção acusatória** e não a semelhança com a isca, porque o alvo da acusação é livre [Q-03].

### 3.6 O Confidente — expressão
- **Válido:** concordância com a ideia central da isca, **só** em mensagem da vítima no PV com o Monstro. Exemplo
  oficial: "Também acho. Ele sempre tenta direcionar as decisões…" → infecção.
- **Inválido:** concordar no público (nunca vale), repetir a isca, citar, discordar, ironia ou pergunta neutra.
- O Confidente não exige segredo nem confissão. Sua identidade é a cumplicidade privada (não é uma cópia do Concordante).

### 3.7 O Eco — expressão lexical (determinística, sem IA)
- **Isca:** o Monstro seleciona **uma palavra** numa mensagem já enviada pela vítima, em qualquer canal. Ela precisa ser
  um **substantivo** [Q-05]. A mensagem de origem não conta.
- **Contagem:** cada ocorrência posterior à ativação, em qualquer canal, soma 1. Com 4 → infecção. Não há prazo.
- **Igualdade exata:** palavra inteira; maiúsculas não importam; **acento importa**; sem flexão, derivação ou sinônimo
  (`fáceis` ≠ `fácil`, `facil`, `facilidade`). **[R]** Usar Unicode NFC e minúsculas, separar palavras por
  fronteira de letras (`\p{L}`), e **não** remover acentos.
- **Vagas:** até **2 tentativas ativas**, cada uma com palavra própria e diferente da outra. A 2ª só é liberada **2 min**
  depois da ativação da 1ª. Uma vaga liberada (infecção, morte ou saída da vítima) pode ser reocupada na hora. A
  palavra fica livre quando sua tentativa termina.

### 3.8 O Reflexo — comportamento
- **MONTAR ISCA:** grava as ações **executadas** pelo próprio Monstro, de **10 s a 2 min**, com pelo menos **3 ações
  válidas** (podem ser da mesma categoria). Se não cumprir isso, não pode infectar. Cada tentativa exige uma captura nova.
- **INFECTAR:** 50 s de observação da vítima em **todos os canais** (público, PV com o Monstro, PV com terceiros).
- **Pontuação:** ação completa = 1; metade = 0,5; ações compostas são divididas em partes pontuáveis. A ordem não
  importa. A frequência gera pontuação proporcional. As ações impossíveis de reproduzir (por exemplo, simular a própria
  infecção) saem do máximo e do obtido. **Infecta se similaridade > 75%** (75% exatos não infecta). Sem 75% ao fim dos
  50 s → falha.
- **Equivalência por tipo de ação:** mesmo destinatário (abrir PV **de Rafael** + enviar mensagem) ou só mesmo tipo
  (criar votação, imagem, áudio: conteúdo livre).
- **[R]** Pontuação de frequência por tipo de ação = `min(n_vítima / n_Monstro, 1)` por chave de ação. Similaridade =
  Σ obtido ÷ Σ máximo, recalculada a cada evento da vítima e com sucesso no primeiro instante em que passar de 75%.
- **Catálogo inicial [R]:** somente eventos que já existem e o servidor registra (CF-06, CF-07). As categorias de
  sentido (acusar, defender, apoiar, ajudar) dependem de decisão do proprietário [Q-06].

### 3.9 O Anfitrião — comportamento
- **Fluxo:** INFECTAR → todos os PVs abertos do Monstro fecham → 25 s.
- **Sucesso:** a vítima abre o PV do Monstro e **envia a primeira mensagem** por iniciativa própria, com qualquer
  conteúdo, dentro dos 25 s (vale a hora em que o servidor recebe a mensagem).
- **Falha:** só abrir o PV, ficar no público, mandar PV a terceiros, responder a uma mensagem do Monstro, ou agir depois
  dos 25 s.
- **[R]** "Iniciativa" = mensagem da vítima no PV do Monstro **sem mensagem do Monstro para ela desde a abertura da
  janela**. O histórico anterior à ativação é ignorado [Q-07].

### 3.10 O Observador — híbrido, progressivo
- **Seleção:** escolher a vítima já inicia a observação. Não há janela de tempo.
- **Livro de Registros:** **30 ações fixas** (as mesmas em toda partida). **10 itens diferentes** preenchidos → infecção
  automática; o status passa a `infectado`, o Monstro é avisado na hora e a vítima após 2 min; o livro zera.
- **Registro:** o Observador seleciona **uma mensagem ou um evento da vítima**, posterior à seleção dela. O **motor**
  decide qual item ainda vazio corresponde: semântico para mensagens (75% + intenção), direto para eventos objetivos
  (pegar o revólver, abrir PV etc.). O Observador nunca escolhe o item. Cada item conta uma vez.
- **Troca de vítima:** zera tudo; nada se transfere; a nova vítima começa em 0 e só contam ações dela depois da seleção.
  Isso vale também depois de uma infecção.
- **A lista das 30 ações precisa de aprovação do proprietário** [Q-08]. Nenhuma lista foi inventada aqui.
- Narrativa preservada: o Livro de Registros é o livro do faroleiro de Ponta Escura (1957; D-40).

## 4. Classificação final

- **Expressão (6):** Concordante, Contestador, Socorro, Delator, Confidente e Eco (o Eco é lexical e não usa semântica).
- **Comportamento (3):** Silencioso, Reflexo (passa a híbrido se entrarem categorias de sentido, Q-06) e Anfitrião.
- **Híbrida (1):** Observador.

## 5. Reconhecimento semântico — opções [R] (decisão do proprietário: Q-10)

Só 6 regras precisam de semântica: as 5 de isca e o Observador. Além disso, a análise acontece **só** com mensagens do
alvo dentro de uma janela aberta (ou mensagens selecionadas pelo Observador), o que dá poucas chamadas por partida.

| Opção | Como funciona | Prós | Contras |
|---|---|---|---|
| A. Só regras locais | Léxicos de intenção (concordar, negar, pedir, acusar), negação, citação, sobreposição com a isca | Custo zero, determinístico, sem integração externa | Muitos falsos negativos (ironia, frases indiretas); não cumpre "sem frases cadastradas" |
| B. Classificador de IA por mensagem candidata | Pré-filtro barato (mensagem do alvo, canal certo, janela aberta) e depois um modelo pequeno responde com intenção e pontuação | Entende linguagem natural, informalidade e ironia | Integração externa (exige autorização), latência de cerca de 1 s, custo por chamada, precisa de fallback |
| **C. Híbrida (recomendada)** | A barra regras óbvias (citação, negação explícita, canal errado); B decide o resto; com B fora do ar, usa A | Menos chamadas, mais qualidade, continua funcionando | Duas peças para testar |

Candidatos para B: Workers AI (mesma conta Cloudflare do PSICOSE) ou um modelo pequeno via API. Escolha, custo e
privacidade das mensagens (LGPD) são decisão do proprietário. Toda decisão do motor é **registrada para auditoria**
(entrada, pontuação, motivo).

## 6. Questões em aberto

**Do proprietário (regras):**

| Id | Questão | Recomendação |
|---|---|---|
| Q-01 | Silencioso: a vítima cai ou vai para segundo plano durante os 80 s | Anular a tentativa **sem** cooldown (nem sucesso nem falha) |
| Q-02 | Socorro: o adendo diz "pedir ajuda **diretamente ao Monstro**"; a especificação aceita pedido ao **grupo** | Seguir a especificação (grupo ou PV com o Monstro); pedido no público dirigido só a outro jogador não vale |
| Q-03 | Delator: acusar **o próprio Monstro** em público conta? "Você está suspeito" é acusação? | Conta (é "outro jogador"); suspeita só vale se apontar alguém como culpado |
| Q-04 | Concordante: a concordância no **PV com o Monstro** vale? Se valer, ele cobre o Confidente | Concordante: só público; Confidente: só PV. Preserva as duas identidades |
| Q-05 | Eco: como validar "substantivo"; a mesma palavra 2× numa mensagem vale 2 pontos?; o Monstro pode cancelar uma tentativa? Sem prazo, existe "falha" (e cooldown)? | Lista de substantivos do português embutida (offline) ou IA só na seleção; 2× = 2 pontos; cancelar libera a vaga sem cooldown |
| Q-06 | Reflexo: categorias de sentido (acusar, defender, apoiar, ajudar); funções que ainda não existem (votação, imagem, áudio) | Catálogo inicial só com eventos existentes; categorias de sentido em fase 2, usando o classificador |
| Q-07 | Anfitrião: o Monstro pode reabrir o PV da vítima e escrever durante os 25 s? Vítima que já está em outro PV | Pode, mas aí a iniciativa deixa de ser da vítima; vale vir de qualquer tela |
| Q-08 | Observador: lista das 30 ações; uma mensagem que corresponde a 2 itens; reselecionar a mesma vítima depois de abandonar; limite de seleções por minuto | 1 mensagem = no máximo 1 item (o de maior pontuação; empate → menor número); reselecionar começa do zero; limite de 1 seleção a cada 10 s (evita "selecionar tudo" e custo) |
| Q-09 | Eco e Observador ficam sem prazo: risco de equilíbrio (um Monstro só esperando) | Avaliar no playtest com 4 jogadores (Agente 1) |
| Q-10 | Mecanismo semântico (§5) e autorização da integração | Opção C |

**Técnicas (Agente 3, resolvidas na implementação):** a mesma mensagem não pode pontuar 2× (chave
`tentativa+mensagem`); concorrência (o DO processa um evento por vez, e o alarm verifica o status antes de agir); troca
de vítima invalida na hora (`attemptId` novo; seleção com `attemptId` antigo é rejeitada); reconexão recupera as
tentativas persistidas; timestamps e ids sempre do servidor.

## 7. Conflitos com documentos e regras anteriores

| Id | Conflito | Proposta |
|---|---|---|
| CF-01 | GDD §5: "só contam mensagens no público ou no PV com o Monstro". O Eco e o Reflexo contam o PV com terceiros; o Delator só o público; o Confidente só o PV | Os canais de cada Monstro prevalecem (D-44); o GDD §5 vira o padrão |
| CF-02 | GDD §5: "escolhe **um** alvo"; janela de cerca de 35 s; confirmação por "expressão válida" | Eco (2 vagas), Observador (sem janela) e as janelas 80/50/25 s são exceções aprovadas (D-44) |
| CF-03 | Adendo do Sistema de Iscas × especificação do Socorro (destino do pedido) | Q-02 |
| CF-04 | Card oficial do Observador ("declara ter percebido uma presença") × Livro de Registros | A especificação prevalece; o conflito C-04 de `MONSTROS.md` fica resolvido |
| CF-05 | `MONSTROS.md` *Proposta v1* (motor por sequência literal, "frase principal" como gatilho, C-01 a C-07) | Substituída nas condições de infecção; a narrativa continua |
| CF-06 | Votações, enquetes, imagens e áudios aparecem no Silencioso e no Reflexo, mas não existem no GDD; voz está fora do beta (PGD-10) | Entram no motor só quando as funções forem aprovadas; o motor já aceita novos tipos de evento |
| CF-07 | "Abrir PV", "alternar conversa", "sair do chat público" são navegação no aparelho; o servidor só vê o que o app informa | Registrar `pv_abrir` enviado pelo app (risco baixo de falsificação, sem ganho para quem falsifica); o Anfitrião confirma pela **mensagem**, que é autoritativa |
| CF-08 | O site publica textos da v1 (habilidade, limitações, rótulo "Frase principal da vítima (gatilho)") | Atualizar as fichas do site depois da aprovação (tarefa separada) |

## 8. Testes obrigatórios (resumo; a lista completa está nas especificações do proprietário)

- **Comuns:** alvo errado não conta; mensagem anterior à janela não conta; evento duplicado conta 1×; alvo já
  infectado é rejeitado; falha → 60 s; o Monstro é avisado na hora e a vítima após 2 min; alarm repetido é ignorado;
  reconexão do servidor retoma as tentativas.
- **Expressão (1, 2, 4, 5, 6):** casos válidos oficiais; negação; ironia; citação; pergunta neutra; canal errado (público
  no Confidente, PV no Delator, PV com terceiros); mensagem com várias ideias; pontuação ≥ 75% sem intenção → falha.
- **Silencioso:** 80 s calado → sucesso; mensagem pública aos 79 s → falha; PV não quebra; queda → Q-01.
- **Eco:** `fáceis` ×4 em canais variados → sucesso; `fácil`, `facil`, `facilidade`, `infáceis` não contam; `FÁCEIS`
  conta; 3 ocorrências → continua; 2ª vaga antes de 2 min → rejeitada; mesma palavra nas 2 vagas → rejeitada; vítima
  infectada → vaga livre na hora.
- **Reflexo:** captura com 9 s ou com 2 ações → rejeitada; ordem trocada → mesma pontuação; frequência 3/5 → 0,6;
  composta incompleta → 0,5; ação impossível fora do cálculo; exatamente 75% → falha; 75,1% → sucesso; isca reutilizada
  → rejeitada.
- **Anfitrião:** os 12 cenários da especificação (abrir sem enviar, Monstro escreve primeiro, 25 s no limite pelo
  servidor, PVs do Monstro fechados).
- **Observador:** os 20 cenários da especificação (terceiros, anterior à seleção, 9 → não infecta, 10 → infecta e zera,
  troca de vítima zera, registro antigo após a troca é rejeitado, mesma mensagem 2× não duplica).

## 9. Plano de implementação (aguarda autorização) [R]

1. `packages/rules/src/infection/`: tipos, as 10 regras, os avaliadores e a interface do classificador, com testes vitest
   de todos os cenários do §8 (classificador falso nos testes).
2. `packages/rules/src/protocol.ts`: mensagens `marcar-isca`, `infectar`, `selecionar-palavra`, `captura-iniciar|encerrar`,
   `observar-selecionar`, `pv-abrir`.
3. `apps/server/src/room.ts`: registro de eventos, tentativas persistidas, alarms, chamada ao motor e avisos (Monstro
   na hora, vítima após 2 min).
4. Classificador semântico conforme Q-10 (opção A primeiro, já que não depende de integração externa).
5. `apps/mobile`: botões e telas (ISCA, INFECTAR, MONTAR ISCA, Livro de Registros, seleção de palavra), pelo Agente 4.
