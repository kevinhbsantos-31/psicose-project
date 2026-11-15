# PSICOSE — Biblioteca dos Monstros

Dono: Agente 2 (conteúdo). O Agente 1 avalia o equilíbrio. Fonte oficial: os **10 cards** do proprietário (D-37).
Os originais estão na raiz do repositório e as cópias exatas em `apps/web/public/img/monstros/`.
Nomes e imagens **não mudam**. A seção "Proposta de design v1" abaixo é **sugestão**: não vale como regra até ser aprovada em `DECISIONS.md`.

## Dados oficiais dos cards

| Nº | Nome oficial | Arquivo original | Especialidade | Condição para a infecção (card) | Frase do card |
|---|---|---|---|---|---|
| 1 | O Concordante | `1-o concordante.jpeg` | Manipulação pela confiança | A vítima aceita explicitamente uma afirmação ou informação apresentada pelo Monstro | "Eu confirmo o que você disse." |
| 2 | O Contestador | `2 - o cotestador.jpeg` | Distorção da realidade | A vítima nega explicitamente uma informação ou acontecimento apresentado pelo Monstro | "Isso nunca aconteceu." |
| 3 | O Silencioso | `3 - o silencioso.jpeg` | Pressão psicológica | A vítima declara que não pretende responder ou falar sobre determinado assunto | "Não vou responder a isso." |
| 4 | O Socorro | `4 - o socorro.jpeg` | Dependência e vulnerabilidade | A vítima pede ajuda explicitamente | "Eu preciso de ajuda." |
| 5 | O Delator | `5 - delator.jpeg` | Desconfiança e acusação | A vítima acusa explicitamente outro participante | "Eu acuso [codinome]." |
| 6 | O Confidente | `6 - o confidente.jpeg` | Intimidade e segredos | A vítima promete compartilhar algo em segredo com o Monstro, especificamente no PV dele | "Vou contar só para você." |
| 7 | O Eco | `7 -  o eco.jpeg` | Imitação e repetição | A vítima reproduz uma expressão específica enviada anteriormente pelo Monstro | — (condição principal: repetir pelo menos 4 palavras consecutivas da mensagem de isca) |
| 8 | O Reflexo | `8 - o reflexo.jpeg` | Identificação e confusão de identidade | A vítima declara uma identificação explícita com o Monstro | "Somos iguais." |
| 9 | O Anfitrião | `9 - o anfitriao.jpeg` | Convite e permissão | A vítima concede verbalmente permissão para que uma presença entre | "Pode entrar." |
| 10 | O Observador | `10 - o observador.jpeg` | Paranoia e percepção | A vítima declara ter percebido uma presença ou figura que os outros não conseguem confirmar | "Eu vi alguém aqui." |

---

# Proposta de design v1 — aguarda aprovação

> **Substituída nas condições de infecção (D-44).** As regras de infecção, o motor e os testes valem em `INFECCAO.md`.
> O §1 (motor por sequência literal) e as condições abaixo ficam só como histórico. A narrativa continua valendo.

Esta proposta mantém todas as regras gerais (GDD §5): alvo único escolhido pelo Monstro; janela de cerca de 35 s; só valem mensagens
do alvo no chat público ou no PV com o Monstro; uma infecção por jogador; o Monstro sabe na hora e a vítima depois de 2 min; espera
de 60 s após falha; vitória sem mudanças. A única exceção individual é a do Confidente, que **já está no card** (ver C-03).

## 0. Conflitos encontrados (o proprietário decide)

| ID | Conflito | Proposta |
|---|---|---|
| C-01 | A frase de cada card é **da vítima**: é o gatilho da infecção. O novo pedido também quer uma frase **do Monstro**, a isca, como "Tudo bem, eu te ajudo." | A frase do card passa a ser a **frase principal da vítima**. A frase do Monstro é nova e só caracteriza o personagem: **não infecta e o servidor não a verifica** |
| C-02 | No exemplo do Socorro, a ajuda é pedida **diretamente ao Socorro**. O card diz só "pede ajuda explicitamente" | Exigir a âncora "dirigida ao Monstro" (§1.3). Sem ela, qualquer "me ajuda" dito ao grupo infectaria |
| C-03 | O Confidente vale **só no PV**, enquanto o GDD §5 aceita chat público ou PV | Manter a exceção do card: segredo é coisa de PV. Pendente desde D-37 |
| C-04 | O Observador exige "presença que **os outros não conseguem confirmar**". O servidor não tem como verificar isso | Remover essa parte. Fica só a declaração de ter visto ou percebido alguém, com uma lista fechada de expressões |
| C-05 | O Delator: se a vítima acusar **o próprio Monstro**, ela é infectada? | **Não.** Acusar corretamente nunca pode punir quem acertou. Só conta acusar outro jogador vivo que não seja o Monstro |
| C-06 | Negação, ironia e citação estão em aberto (PGD-01), assim como frase exata ou equivalência (PGD-02) | §1 propõe regras determinísticas: lista fechada de expressões, bloqueio de negação e de citação. **Ironia não é detectável** e conta como válida |
| C-07 | O Eco: qual mensagem é a "isca"? O card não define | A isca é a **última mensagem do Monstro** antes da abertura da janela, ou qualquer mensagem dele durante a janela |

## 1. Motor de detecção comum (proposta para o Agente 3; sem IA)

### 1.1 Validação

Uma infecção só é confirmada quando todos estes critérios valem:
1. quem enviou a mensagem é o alvo;
2. a tentativa está ativa e dentro do prazo;
3. o canal é válido (público ou PV com o Monstro; o Confidente só aceita o PV);
4. a âncora exigida pelo Monstro é satisfeita (§1.3);
5. a mensagem contém uma expressão cadastrada para aquele Monstro (§1.2);
6. nenhum bloqueio é acionado (§1.4).

### 1.2 Normalização e correspondência

- **Normalização:** minúsculas; sem acentos; pontuação vira espaço; espaços repetidos viram um só; abreviações comuns são expandidas por uma tabela fixa (`vc`→`voce`, `pq`→`porque`, `ta`→`esta`, `tb`/`tbm`→`tambem`, `q`→`que`, `n`→`nao`).
- **Correspondência:** a expressão precisa aparecer como **sequência contígua de palavras** dentro da mensagem. Ela não precisa ser a mensagem inteira, o que permite frases mais elaboradas. Uma palavra solta nunca basta: toda expressão tem 2 palavras ou mais.
- **Lacunas:**
  - `{cod}` = o codinome de um jogador vivo, com regra própria em cada ficha;
  - `{mon}` = o codinome do Monstro;
  - `$` = a expressão precisa terminar a frase (vir antes de fim da mensagem ou de `. ! ? ,`).
- **Lista fechada:** sinônimos não cadastrados **não contam**. Uma variação nova só entra depois de aprovada.

### 1.3 Âncoras ("dirigida ao Monstro")

| Código | Regra objetiva |
|---|---|
| R | **Resposta:** no mesmo canal, a mensagem imediatamente anterior à da vítima foi enviada pelo Monstro |
| P | A mensagem foi enviada no **PV com o Monstro** |
| N | A mensagem contém `{mon}`, ou seja, chama o Monstro pelo codinome |
| — | Sem âncora (qualquer mensagem válida no canal) |

### 1.4 Bloqueios contra falsos positivos

- **Negação:** a expressão é rejeitada se uma destas palavras aparece até 3 palavras antes dela: `nao`, `nunca`, `jamais`, `nem`, `ninguem`.
  - Exemplo: "eu **não** preciso de ajuda" não infecta.
  - Não se aplica às expressões que já são negativas (Contestador e Silencioso).
- **Citação:** a expressão é rejeitada se estiver entre aspas na mensagem original (`"…"`, `“…”`, `'…'`) ou se a mensagem começar com `>`.
- **Pergunta retórica:** não é bloqueada. Não dá para separar uma pergunta retórica de um pedido real sem interpretar o sentido.

---

## 2. Fichas

Legenda: **M** = Monstro · **V** = vítima (alvo) · **X** e **Y** = outros Inocentes.

### 1. O Concordante: *a necessidade de consenso*
- **A. Personalidade:** é o moderador sensato. Resume discussões, organiza votos e transforma conversas confusas em "conclusões". Nunca é o primeiro a acusar e sempre é o primeiro a "fechar o raciocínio".
- **B. Estratégia:**
  - **Como atua:** faz o grupo concordar em pequenas coisas até concordar com ele por reflexo.
    - Começa com afirmações inofensivas e verdadeiras ("ninguém pegou a arma ainda, certo?").
    - Depois passa a afirmações que levam o grupo para onde ele quer.
  - **Sob suspeita:** pede que se recapitule "o que todo mundo já concordou". Usa o histórico para parecer coerente.
  - **Em conflitos:** propõe um meio-termo e pede confirmação.
  - **Oportunidade:** o alvo que costuma responder "sim" rápido.
- **C. Armadilha:**
  1. No público, M: "Recapitulando: X pegou a arma e largou sem explicar." Fato real.
  2. M, em seguida: "V, você estava aqui, foi isso mesmo?"
  3. V: "Foi isso, confirmo." → **infectado** (resposta direta a M).
  - A afirmação nem precisa ser falsa: a armadilha é a **confirmação**.
- **D. Condição:** V usa uma expressão de concordância ou confirmação **em resposta direta a M**. **Âncora: R ou P.**
- **E. Frase do Monstro:** "Então estamos de acordo, certo?"
- **F. Expressões válidas:**
  - **Principal:** "eu confirmo o que você disse".
  - **Outras:** "eu confirmo", "confirmo sim", "foi isso mesmo", "isso mesmo", "você tem razão", "concordo com você", "eu concordo", "faz sentido o que você disse", "exatamente isso", "é verdade o que você falou".
  - **Exemplo elaborado:** "pensando bem, você tem razão, foi o X que pegou".
- **Não ativam:**
  - "não concordo";
  - "você tem razão?" seguido de "não, espera" (o bloqueio de negação não pega essa forma; só a ordem das mensagens decide);
  - "sim" ou "ok" isolados (não cadastrados);
  - "concordo com o X" quando a mensagem anterior não é de M;
  - "ele disse 'eu confirmo'" (citação).
- **G. Limitações:** depende de a vítima responder logo depois dele. Basta que outra pessoa fale entre os dois para quebrar a âncora R. "Sim" e "ok" sozinhos não infectam. Um grupo que discorda por hábito o neutraliza.
- **H. Como identificar:** alguém que sempre "resume" a conversa e termina perguntas com "certo?", "né?" ou "confirma?". Os resumos dele têm pequenas distorções.
- **I. Como evitar:** não confirme de imediato o que acabaram de dizer. Responda com dados próprios ("eu vi X pegar a arma") em vez de validar a frase dos outros.
- **J. Ameaça: 4.** Concordar é comum e soa inofensivo. A âncora R limita a ameaça, porque ele precisa de uma pergunta e de uma resposta imediata.

### 2. O Contestador: *o orgulho de estar certo*
- **A. Personalidade:** é o cético briguento. Corrige os outros, aponta contradições (às vezes inventadas) e não larga uma discussão.
- **B. Estratégia:**
  - **Como atua:** é um gaslighting ao contrário. Ele **atribui** à vítima algo que ela não disse ou não fez, para provocar uma negação enfática.
  - **Sob suspeita:** diz que quem o acusa "está distorcendo" e cita mensagens fora de contexto.
  - **Em conflitos:** entra para aumentar a briga.
  - **Oportunidade:** jogadores orgulhosos e defensivos, que respondem rápido a ataques.
- **C. Armadilha:**
  1. M: "V, você mesmo disse agora há pouco que ia autorizar o tiro no Y."
  2. V: "Isso nunca aconteceu, para de inventar." → **infectado**.
  - Variante: M: "Você pegou a arma escondido." V: "Eu não peguei arma nenhuma." Esta forma também vale.
- **D. Condição:** V nega um fato **em resposta direta a M**. **Âncora: R ou P.**
- **E. Frase do Monstro:** "Você mesmo disse isso, está no chat."
- **F. Expressões válidas:**
  - **Principal:** "isso nunca aconteceu".
  - **Outras:** "isso não aconteceu", "eu não disse isso", "eu nunca disse isso", "eu não falei isso", "eu não fiz isso", "eu não peguei", "isso é mentira", "é mentira sua", "para de inventar", "você está inventando", "isso não é verdade".
  - **Exemplo elaborado:** "rola o chat pra cima, eu não disse isso em momento nenhum".
- **Não ativam:**
  - "talvez eu tenha dito" (não cadastrado);
  - "o X disse que isso não aconteceu" quando a mensagem anterior não é de M;
  - "mentira" isolada;
  - "não é mentira" (o bloqueio de negação vale para "é mentira").
- **G. Limitações:** precisa provocar e ficar exposto. Responder sem negar quebra a armadilha: "role o chat e veja você mesmo" não infecta. Uma vítima que não responde o neutraliza.
- **H. Como identificar:** atribui falas aos outros com frequência, e o histórico pode desmentir essas atribuições, porque mensagens não podem ser apagadas.
- **I. Como evitar:** quando alguém distorcer o que você disse, aponte a mensagem em vez de negar ("veja minha mensagem das 21h") ou peça a um terceiro que verifique.
- **J. Ameaça: 3.** A reação de negar é instintiva, mas o comportamento dele é chamativo e o histórico funciona como prova contra ele.

### 3. O Silencioso: *o medo de se expor*
- **A. Personalidade:** é o observador frio, que fala pouco. Quando fala, faz **perguntas curtas e invasivas**. Quase nunca dá opinião.
- **B. Estratégia:**
  - **Como atua:** interroga. Faz perguntas pessoais ou incriminatórias em sequência, até a vítima se recusar a continuar.
  - **Sob suspeita:** devolve com outra pergunta.
  - **Em conflitos:** pergunta "por que você está tão nervoso?".
  - **Oportunidade:** o jogador que já está na defensiva ou sendo acusado por outros.
- **C. Armadilha:**
  1. X acusa V.
  2. M, sem acusar: "V, por que você estava no PV com o Y logo antes?"
  3. M: "E o que vocês combinaram?"
  4. V: "Não vou responder isso." → **infectado**.
- **D. Condição:** V declara que não vai responder ou falar **em resposta direta a M**. **Âncora: R ou P.**
- **E. Frase do Monstro:** "É uma pergunta simples."
- **F. Expressões válidas:**
  - **Principal:** "não vou responder a isso".
  - **Outras:** "não vou responder", "não vou falar sobre isso", "não vou falar nada", "não tenho que responder", "não te devo explicação", "prefiro não responder", "sem comentários", "não vou explicar nada", "isso não te interessa".
  - **Exemplo elaborado:** "olha, não vou responder isso agora, não confio em você".
- **Não ativam:**
  - silêncio (não enviar mensagem não ativa nada);
  - "já respondi lá em cima";
  - "pergunta pro Y";
  - "não sei" (não cadastrado);
  - "ele disse 'não vou responder'" (citação).
- **G. Limitações:** só pergunta; não consegue forçar uma resposta. Uma resposta qualquer, até evasiva, o neutraliza ("estávamos falando do revólver"). É fraco contra jogadores transparentes. Perguntar demais o torna suspeito.
- **H. Como identificar:** quem quase não opina mas faz muitas perguntas dirigidas, sempre a um jogador só, por vez e em sequência.
- **I. Como evitar:** em vez de se recusar, responda o mínimo ou redirecione ("estávamos falando do revólver"). Ficar em silêncio também é seguro.
- **J. Ameaça: 2.** A recusa só acontece sob pressão forte, e o padrão de interrogatório chama atenção.

### 4. O Socorro: *a dependência*
(Ficha-referência do proprietário, adaptada ao motor.)
- **A. Personalidade:** é o amigo de todos. Prestativo e conciliador, propõe trabalho em equipe.
- **B. Estratégia:** mostra competência e disponibilidade até virar "a pessoa para quem se pede ajuda". Oferece análises e organiza o plano. Sob suspeita, se mostra magoado e ainda mais útil.
- **C. Armadilha:**
  1. M ajuda V em público duas vezes, por exemplo resumindo pistas do VHS.
  2. M, no PV: "Se precisar de mim para pegar o Monstro, é só falar."
  3. V, no PV: "Preciso da sua ajuda com o X." → **infectado**.
- **D. Condição:** V pede ajuda **dirigida a M**. **Âncora: P, N ou R.** (C-02)
- **E. Frase do Monstro:** "Tudo bem, eu te ajudo."
- **F. Expressões válidas:**
  - **Principal:** "eu preciso de ajuda".
  - **Outras:** "preciso da sua ajuda", "me ajuda", "me ajude", "pode me ajudar", "você me ajuda", "me dá uma ajuda", "me ajuda aqui", "socorro me ajuda".
  - **Exemplos:** "{mon}, me ajuda a pegar ele"; "não estou conseguindo, me ajuda".
- **Não ativam:**
  - "não preciso de ajuda" (negação);
  - "ajuda" isolada;
  - "X, me ajuda" no público quando a mensagem anterior não é de M;
  - "posso te ajudar?" (oferecer ajuda não infecta).
- **G. Limitações:** oferecer ajuda não infecta. Precisa de tempo para conquistar confiança. É fraco contra quem centraliza decisões em grupo.
- **H. Como identificar:** prestativo demais, conquista a confiança de todos muito rápido e se oferece "só para você" no PV.
- **I. Como evitar:** peça ajuda ao **grupo**, não a uma pessoa. Desconfie do aliado perfeito.
- **J. Ameaça: 3.** O pedido de ajuda é natural, mas a armadilha leva tempo e o gatilho exige âncora.

### 5. O Delator: *a paranoia coletiva*
- **A. Personalidade:** é o investigador inflamado. Acelera o jogo, cobra posições ("e você, desconfia de quem?") e organiza "rodadas de suspeitas".
- **B. Estratégia:**
  - **Como atua:** transforma a dúvida em acusação formal. Ele raramente acusa; **pede que os outros acusem**.
  - **Sob suspeita:** concorda que deve ser investigado e redireciona ("ótimo, então vamos todos falar em quem votamos").
  - **Oportunidade:** momentos tensos, logo depois de uma pista do VHS.
- **C. Armadilha:**
  1. Uma pista do VHS aponta para X ou Y.
  2. M, no público: "Chega de enrolação. Cada um fala de quem desconfia. V, começa você."
  3. V: "Eu acuso o X." → **infectado** (X é Inocente).
- **D. Condição:** V faz uma acusação explícita contra **outro jogador vivo que não seja o Monstro** (C-05). **Âncora: nenhuma.** A própria acusação já é dirigida.
- **E. Frase do Monstro:** "Fala logo, de quem você desconfia?"
- **F. Expressões válidas** (`{cod}` = jogador vivo, exceto a vítima e o Monstro):
  - **Principal:** "eu acuso {cod}".
  - **Outras:** "acuso o {cod}", "o monstro é o {cod}", "{cod} é o monstro", "foi o {cod}", "é o {cod}", "meu voto é no {cod}", "atira no {cod}".
  - **Exemplo elaborado:** "pelo VHS, o monstro é o {cod}, sem dúvida".
- **Não ativam:**
  - "desconfio do {cod}" (suspeita não é acusação);
  - "o {cod} está estranho";
  - "eu acuso o {mon}" (acusar o Monstro);
  - "não é o {cod}" (negação);
  - "você acha que é o {cod}?" contém "é o {cod}" e **ativaria** (ver risco em §5).
- **G. Limitações:** acusações vagas e suspeitas não contam. É fraco contra grupos que usam linguagem de dúvida ("acho", "desconfio"). Pressionar demais o expõe.
- **H. Como identificar:** quem exige acusações formais, impõe prazos e raramente se compromete com um nome.
- **I. Como evitar:** fale em suspeitas ("desconfio de…") até ter certeza. Não aceite a pressão por um "veredito" imediato.
- **J. Ameaça: 4.** A acusação é central no gênero e aparece naturalmente. O que equilibra: suspeitas não contam e acusar o Monstro é seguro.

### 6. O Confidente: *o segredo*
- **A. Personalidade:** discreto e acolhedor em público. No PV é caloroso e cúmplice. Faz cada jogador sentir que é "o único em quem ele confia".
- **B. Estratégia:**
  - **Como atua:** troca segredos. Primeiro conta um "segredo" falso ou banal para criar reciprocidade, depois espera a promessa de retribuição.
  - **Sob suspeita:** "eu só falo no PV porque tenho medo do Monstro ler".
  - **Oportunidade:** o jogador isolado ou que acabou de ser acusado.
- **C. Armadilha:**
  1. M, no PV: "Vou te contar uma coisa que não falei para ninguém: acho que o Y simulou a infecção."
  2. M: "E você, notou alguma coisa?"
  3. V: "Notei, vou te contar só pra você." → **infectado**.
- **D. Condição:** V promete revelar algo em segredo **no PV com M**. **Âncora: P obrigatória** (exceção do card, C-03).
- **E. Frase do Monstro:** "Isso fica só entre nós."
- **F. Expressões válidas:**
  - **Principal:** "vou contar só para você".
  - **Outras:** "vou te contar uma coisa", "vou te contar um segredo", "só pra você", "fica entre nós", "não conta pra ninguém", "vou te falar em segredo", "guarda segredo".
  - **Exemplo elaborado:** "tá, vou te contar só pra você o que o X me disse".
- **Não ativam:**
  - qualquer frase no chat público;
  - "não vou te contar" (negação);
  - "vou contar pro grupo";
  - "fica entre nós?" dito pelo próprio M (não é mensagem da vítima).
- **G. Limitações:** só funciona no PV, e o PV com ele precisa estar aberto. É fraco contra quem compartilha tudo em público.
- **H. Como identificar:** quem pouco fala em público, é muito ativo nos PVs e "sabe coisas" que ninguém disse no chat.
- **I. Como evitar:** traga para o público o que recebeu em segredo. Não prometa exclusividade.
- **J. Ameaça: 2.** O gatilho é íntimo e natural, mas o canal restrito e a necessidade de construir confiança limitam muito.

### 7. O Eco: *o contágio da linguagem*
- **A. Personalidade:** carismático e espirituoso. Cria bordões, apelidos e "frases de efeito" que o grupo adora repetir.
- **B. Estratégia:**
  - **Como atua:** **planta** uma frase marcante de 4 palavras ou mais e espera que a vítima a repita, o que acontece naturalmente quando ela concorda, ironiza ou cita.
  - **Sob suspeita:** faz piada.
  - **Oportunidade:** discussões em que todos repetem o argumento do outro.
- **C. Armadilha:**
  1. M: "Quem pegar a arma primeiro é quem tem medo do monstro." Esta é a isca.
  2. M abre a tentativa contra V.
  3. V: "Pois é, quem pegar a arma primeiro é suspeito." → 5 palavras consecutivas da isca → **infectado**.
- **D. Condição:** V repete pelo menos **4 palavras consecutivas** da isca (C-07), depois da normalização. **Âncora: nenhuma.** A cópia já é o vínculo.
- **E. Frase do Monstro:** variável; é a própria isca. O bordão dele é "Repete comigo."
- **F. Válidas:** qualquer sequência de 4 palavras da isca (exemplo acima). **Não há banco fixo**: o banco é a isca.
- **Não ativam:**
  - 3 palavras ou menos;
  - palavras da isca fora de ordem;
  - a isca entre aspas (citação);
  - repetir uma frase antiga do Monstro, que não seja a isca.
  - **Proposta:** sequências feitas só de palavras vazias não contam, como "que eu não sei" (lista de 40 palavras comuns, a definir pelo Agente 3).
- **G. Limitações:** precisa de uma isca marcante e de que a vítima a repita a tempo, em cerca de 35 s. A isca fica no histórico e pode ser rastreada. É fraco contra quem parafraseia.
- **H. Como identificar:** quem solta frases "prontas", às vezes estranhas, antes de silêncios.
- **I. Como evitar:** fale com as suas próprias palavras. Não repita bordões.
- **J. Ameaça: 3.** É muito furtivo, mas exige preparo e é sensível ao tempo.

### 8. O Reflexo: *o pertencimento*
- **A. Personalidade:** o "gêmeo social". Espelha o estilo de escrita, as opiniões e as suspeitas da vítima e diz o que ela pensa antes dela.
- **B. Estratégia:**
  - **Como atua:** constrói uma aliança por semelhança: "pensamos igual, então somos o time".
  - **Sob suspeita:** "se eu fosse o Monstro, você também seria, a gente pensou igual o tempo todo".
  - **Oportunidade:** o jogador que se sente incompreendido ou isolado pelo grupo.
- **C. Armadilha:**
  1. M copia as suspeitas de V em público e o defende.
  2. M, no PV: "Engraçado, desde o começo a gente desconfia das mesmas pessoas."
  3. V: "Verdade, somos iguais." → **infectado**.
- **D. Condição:** V declara identificação explícita **com M**. **Âncora: R ou P.**
- **E. Frase do Monstro:** "Você pensa exatamente como eu."
- **F. Expressões válidas:**
  - **Principal:** "somos iguais".
  - **Outras:** "a gente é igual", "somos parecidos", "sou igual a você", "penso igual a você", "penso como você", "eu sou como você", "você me entende", "a gente pensa igual", "mesma cabeça".
  - **Exemplo elaborado:** "kkk somos iguais mesmo, vamos juntos nessa".
- **Não ativam:**
  - "não somos iguais" (negação);
  - "concordo" (é do Concordante, não do Reflexo);
  - "somos iguais" dito no público depois de uma mensagem de X (sem âncora).
- **G. Limitações:** precisa construir a semelhança ao longo da partida. Uma aliança baseada em fatos, não em semelhança, o neutraliza.
- **H. Como identificar:** alguém que muda de opinião para combinar com a sua e copia seu jeito de escrever.
- **I. Como evitar:** forme alianças por evidências, não por afinidade. Não declare identificação.
- **J. Ameaça: 2.** A frase-gatilho é rara fora de uma aliança construída de propósito.

### 9. O Anfitrião: *a hospitalidade e a inclusão*
- **A. Personalidade:** organizado, educado e "cerimonioso". Pede licença para tudo: entrar na conversa, no PV, na aliança, no plano.
- **B. Estratégia:**
  - **Como atua:** faz pedidos de permissão inofensivos para que **conceder** vire hábito. Explora a culpa de excluir alguém.
  - **Sob suspeita:** "eu só pedi para participar, vocês estão me excluindo".
  - **Oportunidade:** alianças de 2 jogadores, em que ele pede para "entrar".
- **C. Armadilha:**
  1. V e X formam uma aliança em público.
  2. M: "Posso entrar no grupo de vocês? Prometo ajudar."
  3. V: "Pode entrar." → **infectado**.
  - Variante no PV: M: "Posso entrar no seu PV um minuto?" V: "Pode, entra."
- **D. Condição:** V concede permissão **em resposta direta a M**. **Âncora: R ou P.**
- **E. Frase do Monstro:** "Posso entrar?"
- **F. Expressões válidas:**
  - **Principal:** "pode entrar".
  - **Outras:** "pode vir", "entra aí", "pode entrar sim", "tá liberado", "está liberado", "pode participar", "fica à vontade", "seja bem vindo", "pode sim entrar".
  - **Exemplo elaborado:** "tá, pode entrar, mas fala o que você sabe".
- **Não ativam:**
  - "não pode entrar" (negação);
  - "pode" isolado;
  - "entra no PV do X" dito a outro jogador (sem âncora).
- **G. Limitações:** depende de uma estrutura onde se possa "entrar" (aliança, PV, plano). Uma recusa educada ("fala aqui no público mesmo") o neutraliza.
- **H. Como identificar:** quem pede permissão o tempo todo e quer participar de todas as alianças.
- **I. Como evitar:** não "autorize" entradas. Mantenha a conversa aberta no público.
- **J. Ameaça: 3.** Pedidos de permissão são socialmente difíceis de recusar, mas o padrão é perceptível.

### 10. O Observador: *a sugestão e a paranoia*
- **A. Personalidade:** inquieto e "sensível". Comenta detalhes estranhos ("vocês notaram que o Y ficou digitando e parou?") e cria clima de vigilância.
- **B. Estratégia:**
  - **Como atua:** sugere presenças: "alguém está lendo tudo", "senti que tem mais alguém aqui". Faz isso até a vítima **relatar ter percebido** algo também.
  - **Sob suspeita:** "eu só estou dizendo o que eu vejo".
  - **Oportunidade:** logo depois do Jornal VHS ou de uma morte, quando o clima é de medo.
- **C. Armadilha:**
  1. Depois de uma transmissão do VHS, M: "Não sei vocês, mas eu tenho a sensação de que tem alguém olhando."
  2. M: "V, você sentiu também?"
  3. V: "Senti. Parece que tem alguém aqui." → **infectado**.
- **D. Condição:** V declara ter visto ou percebido uma presença (C-04: a parte "não confirmável" foi removida). **Âncora: nenhuma**, mas com o marcador de fim de frase `$` nas formas curtas.
- **E. Frase do Monstro:** "Você também está vendo?"
- **F. Expressões válidas:**
  - **Principal:** "eu vi alguém aqui".
  - **Outras:** "eu vi alguém", "vi uma figura", "vi um vulto", "senti uma presença", "tem alguém aqui$", "tem alguém olhando", "tem alguém me observando", "alguém está observando", "eu também vi".
  - **Exemplo elaborado:** "não é paranoia, eu vi um vulto no canto da tela".
- **Não ativam:**
  - "tem alguém aqui mentindo" (o `$` não é satisfeito);
  - "eu não vi ninguém" (negação);
  - "você viu alguém?" dito por M;
  - "vi o X pegar a arma" (não cadastrado).
- **G. Limitações:** o gatilho não aparece numa conversa sobre o jogo sem que ele crie o clima, e isso o deixa estranho. Jogadores focados em fatos o neutralizam.
- **H. Como identificar:** quem fala de presenças, sensações e "estar sendo observado" em vez de fatos.
- **I. Como evitar:** não relate percepções ("vi", "senti") sobre presenças. Fale só do que está no chat.
- **J. Ameaça: 2.** Muito temático e assustador, mas a condição é rara e o comportamento que a provoca é visível.

---

## 3. Tabela comparativa

| Nº | Monstro | Vulnerabilidade explorada | Postura no grupo | Âncora | Gatilho (V) | Ameaça | Depende de |
|---|---|---|---|---|---|---|---|
| 1 | Concordante | Necessidade de consenso | Moderador | R/P | Confirmar o que M disse | 4 | Interação |
| 2 | Contestador | Orgulho, defesa da própria imagem | Cético briguento | R/P | Negar o que M atribuiu | 3 | Interação |
| 3 | Silencioso | Medo de exposição | Interrogador frio | R/P | Recusar-se a responder | 2 | Interação |
| 4 | Socorro | Dependência e confiança | Amigo prestativo | P/N/R | Pedir ajuda a M | 3 | Planejamento |
| 5 | Delator | Pressão de grupo e desconfiança | Investigador inflamado | — | Acusar um Inocente | 4 | Interação |
| 6 | Confidente | Intimidade e segredo | Cúmplice no PV | P (só) | Prometer segredo | 2 | Planejamento |
| 7 | Eco | Conformidade de linguagem | Carismático, faz bordões | — (isca) | Repetir 4 palavras da isca | 3 | Planejamento |
| 8 | Reflexo | Pertencimento | "Gêmeo" espelho | R/P | Declarar identificação | 2 | Planejamento |
| 9 | Anfitrião | Culpa por excluir | Cerimonioso | R/P | Conceder entrada | 3 | Interação |
| 10 | Observador | Medo e sugestionabilidade | Inquieto "sensível" | — ($) | Relatar ter percebido alguém | 2 | Planejamento |

Os níveis de ameaça estão justificados em cada ficha (campo J). As condições estão nos campos D, o banco de expressões nos campos F e as mensagens que não ativam logo abaixo de cada banco: não repito aqui.

## 4. Sobreposições e como foram separadas

| Par | Risco | Separação adotada |
|---|---|---|
| Concordante × Reflexo | As duas condições são formas de "estar de acordo" | Concordante = validar uma **afirmação**. Reflexo = declarar **semelhança de identidade**. Os bancos são disjuntos ("concordo" ≠ "somos iguais") |
| Concordante × Eco | Repetir o argumento do outro também é concordar | Eco exige 4 palavras **literais** da isca. Concordante usa expressões de confirmação |
| Contestador × Silencioso | Os dois provocam uma reação defensiva | Contestador = **negar** um fato. Silencioso = **recusar-se** a falar. Isca diferente: atribuição falsa × interrogatório |
| Socorro × Confidente | Os dois constroem confiança individual | Socorro = **pedir** algo ao Monstro. Confidente = **oferecer** um segredo, só no PV |
| Socorro × Anfitrião | Os dois criam uma relação de favor | Socorro: a vítima pede. Anfitrião: a vítima **concede** |
| Delator × Contestador | Os dois alimentam conflito | Delator canaliza o conflito para **acusar um terceiro**. Contestador o dirige **contra a própria vítima** |

Não há dois Monstros com a mesma estratégia social. A sobreposição restante é de **clima**, não de mecânica.

## 5. Balanceamento (análise do Agente 2; a avaliação final é do Agente 1)

- **Mais difíceis de identificar:** Eco (a isca parece uma conversa normal), Concordante (parece sensato) e Socorro (parece o melhor aliado).
- **Mais fáceis de identificar:** Observador (fala de presenças), Silencioso (interroga) e Contestador (atribui falas falsas, o que o histórico desmente).
- **Maior facilidade de infectar:** Concordante e Delator, porque os gatilhos fazem parte do vocabulário natural do jogo.
- **Mais dependentes de planejamento:** Eco, Reflexo, Confidente e Socorro.
- **Mais dependentes da interação dos jogadores:** Delator, Contestador, Silencioso e Anfitrião.
- **Possivelmente fortes demais:**
  - **Delator:** "é o {cod}" e "foi o {cod}" aparecem até em perguntas ("você acha que é o X?"). **Recomendação:** retirar as duas formas e deixar só as acusações declarativas ("eu acuso", "o monstro é o", "meu voto é no", "atira no"). Se ainda assim ficar forte, exigir o `$` também.
  - **Concordante:** "isso mesmo" e "exatamente isso" são muito frequentes. **Recomendação:** mantê-las só com a âncora R estrita, como já está.
- **Condições que podem ser raras:**
  - **Observador:** depende de o Monstro induzir o clima.
  - **Reflexo:** a frase não é comum.
  - **Confidente:** só no PV.
  - **Recomendação:** testar no beta; se a taxa de infecção ficar muito baixa, ampliar o banco **com aprovação**, sem afrouxar as âncoras.
- **Telemetria sugerida para o beta:** registrar, por Monstro, as tentativas, as infecções e qual expressão disparou. Os registros devem ser **anônimos e sem o texto completo**. Isso permite ajustar os bancos com dados, não com impressão.

## Arquivo dos Monstros (D-38)

Um documento narrativo por Monstro (diário, carta, relatório, manuscrito, transcrição, registro, página arrancada ou arquivo confidencial), coerente com as fichas acima. Texto-fonte: `apps/web/public/js/arquivo.js`. Nº 4 usa a referência editorial D-14 ("Ajuda Aqui", Elias V., 1954).

## Pendências (decisão do proprietário)

1. Aprovar ou ajustar os conflitos C-01 a C-07 (§0) e o motor de detecção (§1). Isso resolve PGD-01 e PGD-02.
2. Aprovar as 10 fichas e os bancos de expressões. Só depois disso o Agente 3 implementa a detecção, e os textos podem ir para o site, que hoje mostra os campos "A definir".
3. O Agente 1 revisa o equilíbrio (§5), principalmente o Delator e o Concordante.
4. Ficha narrativa ainda não feita, porque este pedido tratou de comportamento: origem e história, aparência.
5. Nome do arquivo nº 2: "cotestador" × card **"O Contestador"**. O site usa o nome do card.
