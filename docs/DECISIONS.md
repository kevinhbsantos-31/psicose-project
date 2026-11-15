# PSICOSE — Registro de Decisões

> Dono: Orquestrador Master · Só o proprietário aprova ou rejeita.
> Status: **Aprovada** · **Rejeitada** · **Hipótese** (considerada, não decidida) · **Pendente** · **Lacuna** (não prevista; precisa de resposta)

## Aprovadas

| ID | Decisão | Data |
|---|---|---|
| D-01 | PSICOSE é um jogo multiplayer de dedução social e terror psicológico | 12/11/2026 |
| D-02 | Primeiro produto: beta privado com exatamente 4 jogadores (proprietário + 3 convidados) | 12/11/2026 |
| D-03 | Plataforma do beta: **exclusivamente Android** | 12/11/2026 |
| D-04 | Produto final: expansão para Android e iOS | 12/11/2026 |
| D-05 | Beta: backend hospedado, tempo real, autenticação, salas privadas por convite ou código | 12/11/2026 |
| D-06 | Mecânicas críticas validadas no servidor | 12/11/2026 |
| D-07 | Sem matchmaking público no beta | 12/11/2026 |
| D-08 | Ambientes de teste e produção separados | 12/11/2026 |
| D-09 | Beta deve permitir reiniciar partidas e registrar erros | 12/11/2026 |
| D-10 | Base real e evolutiva, reaproveitável no produto final (sem protótipo descartável) | 12/11/2026 |
| D-11 | Regras centrais do `GDD.md` (seções 2 a 8) | 12/11/2026 |
| D-12 | Estrutura com Orquestrador Master + 6 agentes; nenhum assume a responsabilidade principal de outro | 12/11/2026 |
| D-13 | Economia sem pay-to-win | 12/11/2026 |
| D-14 | Referência editorial do Agente 2: "Ajuda Aqui — A Arte de Ser Necessário", manuscrito atribuído a Elias V., 1954 | 12/11/2026 |
| D-15 | Comunicação e documentação em português brasileiro; termos técnicos no original | 12/11/2026 |
| D-16 | Diretriz: máxima qualidade com o mínimo de créditos Claude | 12/11/2026 |
| D-17 | Formato: jogo de **chat e interface**, sem mapa, movimentação ou exploração de cenário em tempo real | 12/11/2026 |
| D-18 | Prioridade técnica: app Android de **interface convencional** + **backend multiplayer autoritativo**. Engine de jogos 3D descartada | 12/11/2026 |
| D-19 | **Voz fora do primeiro beta.** Comunicação só por texto (chat público + mensagens privadas). A arquitetura pode prever voz no futuro, mas não se implementa nem se configura infraestrutura de áudio agora | 12/11/2026 |

| D-20 | **Stack aprovada:** app React Native + Expo + TypeScript · multiplayer em Cloudflare Workers + Durable Objects · salas via PartyServer · cliente PartySocket · Supabase Auth + PostgreSQL · Sentry | 12/11/2026 |
| D-21 | Requisitos obrigatórios: servidor autoritativo; estado essencial **persistido** (nunca só em memória); eventos temporizados persistidos e handlers **idempotentes**; reconexão com recuperação de estado; ambientes dev/staging/produção; regras desacopladas da interface e da infraestrutura; proteção rigorosa de papéis e dados privados | 12/11/2026 |
| D-22 | **Isolamento:** é proibido acessar, consultar, alterar ou reutilizar recursos do outro projeto do proprietário. O conector Supabase global só pode ser usado depois de restrito ao projeto PSICOSE | 12/11/2026 |
| D-23 | Vercel fora do beta (não comporta WebSocket com estado). Pode servir ao site futuro | 12/11/2026 |

## Provisórias P-01 a P-07 → resolvidas em 12/11/2026

| ID | Decisão aprovada | Era |
|---|---|---|
| D-24 | Login por **código enviado por e-mail** (Supabase OTP) | P-01 |
| D-25 | A partida **começa automaticamente** quando a 4ª vaga é ocupada. Não existe "dono" da sala | P-02 (mudou: antes o criador iniciava) |
| D-26 | O lobby **não mostra identidades**, só as vagas. Os codinomes são sorteados no início, em ordem embaralhada | P-03 |
| D-27 | Lista de codinomes **neutra** no beta, até os Agentes 2/4 definirem a definitiva | P-04 |
| D-28 | Chat só **durante a partida**. Mensagens com até 500 caracteres | P-05 |
| D-29 | **Queda de conexão** mantém a vaga e a pessoa reconecta. **"Sair" no lobby** libera a vaga. **"Sair" durante a partida = abandono definitivo**: não volta, não envia nem recebe mensagens privadas, e os outros veem "(saiu)". Efeito do abandono nas condições de vitória: **pendente (PGD-12, Agente 1)** | P-06 (mudou: antes "sair" na partida só desconectava) |
| D-30 | Estado da partida só no **armazenamento durável do Durable Object**. O Postgres entra quando houver histórico entre partidas | P-07 |
| D-31 | Se o **Monstro abandonar voluntariamente**, os **Inocentes vencem na hora** e a partida é encerrada. Queda de conexão **não** é abandono e não aciona a regra | PGD-12 (parcial) |
| D-32 | **Identidade sonora:** trilha ambiente de suspense psicológico, grave e atmosférica, com ruído, interferência e terror analógico/VHS. Variações nos momentos-chave, efeitos para alertas do governo, VHS e infecção. Loop com transições suaves, volume e silenciar, áudio local, sem atrapalhar a leitura. Voz fora do beta. Detalhes: `docs/design/IDENTIDADE_SENSORIAL.md` | Diretriz do proprietário |
| D-33 | **Origem e licença do áudio:** prioridade para áudio original do PSICOSE; permitidas bibliotecas com licença comercial explícita para jogos/apps, domínio público e CC0, e IA quando os termos autorizarem o uso comercial. Proibido material com restrição a uso comercial, distribuição ou modificação, músicas comerciais conhecidas e cópia de trilhas de outros jogos. Origem, licença e condições de cada arquivo ficam registradas. A proposta de identidade sonora está aprovada; produção extensa só depois da proposta técnica | PT-11 |
| D-34 | **Responsáveis pelo áudio:** Agente 4 (direção sonora, ambiente, efeitos de interface, alertas, integração no app, **coordena** a implementação); Agente 2 (identidade sonora dos Monstros e efeitos narrativos das criaturas); Agente 1 (define quais acontecimentos da partida acionam efeitos) | L-11 |
| D-37 | Os **10 Monstros oficiais** são os dos cards do proprietário: O Concordante, O Contestador, O Silencioso, O Socorro, O Delator, O Confidente, O Eco, O Reflexo, O Anfitrião, O Observador. Conteúdo e pendências em `docs/MONSTROS.md` | Proprietário |
| D-36 | **Logotipo oficial** (`assets/branding/logo-psicose.jpeg`) é a referência central da identidade visual do site e do app. Usado sempre **sem alterações**. Sistema visual em `docs/design/IDENTIDADE_VISUAL.md` | Proprietário |
| D-35 | **Arquitetura de áudio aprovada** com `expo-audio`. Sons **definitivos: originais gerados por IA**, com termos que permitam uso comercial. **Beta: sons provisórios CC0** | PT-11 |
| D-38 | **Meus Monstros, Arquivo dos Monstros e Biblioteca** (estrutura no site, pode mudar no futuro): coleção de Monstros no perfil; Monstro preferido ou aleatório, usado só se o jogador for sorteado Monstro (não altera o sorteio; vale nas partidas quando L-07 for implementada); documentos narrativos à venda por documento ou coleção; leitura no site. Pagamento só demonstrativo (PT-09) | Proprietário |
| D-39 | **Regra anti-vantagem (D-13):** qualquer Monstro pode ser sorteado para qualquer jogador; possuir um Monstro libera apenas escolhê-lo como preferido. Documentos ampliam a narrativa e o método, sem estratégia exclusiva que dê vantagem em partida (resolve PT-13) | Proprietário |
| D-40 | **Origem e aparência dos 10 Monstros** aprovadas e publicadas (`apps/web/public/js/monstros.js`). Universo: cidade de **Itaverá**. As imagens são a forma verdadeira reconstruída por sobreviventes; os Monstros imitam a aparência humana (advertência no fim de cada ficha e no topo da página Monstros) | Proprietário |
| D-41 | **Comissão de afiliados:** 50% do valor líquido efetivamente recebido em cada compra elegível do cliente indicado, vitalícia; vínculo permanente no banco e imutável; reembolsos e chargebacks geram estorno; sem desconto de despesas genéricas | Proprietário |
| D-42 | **Pagamento de comissões todo sábado**, só com confirmação real do administrador; comissão não liberada passa para o sábado seguinte; sem valor mínimo nem taxa de saque | Proprietário |
| D-43 | **Motor Universal de Infecção** (expressão, comportamento, híbrido) e **Sistema Universal de Iscas**: um motor compartilhado com uma regra configurável por Monstro; servidor autoritativo; 75% só junto com a análise de intenção; nenhuma estratégia ou frase pré-cadastrada; sem IA externa por padrão (`INFECCAO.md` §1, §2) | Proprietário |
| D-44 | **Especificações individuais de infecção dos 10 Monstros** (janelas, canais e quantidade de tentativas próprias de cada Monstro prevalecem sobre o GDD §5) em `INFECCAO.md` §3. Questões Q-01 a Q-10 e conflitos CF-01 a CF-08 aguardam o proprietário. **Implementação ainda não autorizada** | Proprietário |
| D-45 | **Diretrizes de progressão:** skins básicas gratuitas (masculina ou feminina) escolhidas na criação da conta; skins extras na loja do site e por nível ou evento; tela de resultado (Monstro vence: nome, skin e Monstro; Inocente vence matando o Monstro: nome e skin, sem Monstro); XP e níveis; matchmaking por nível; desbloqueios por nível integrados a "Meus Monstros" (3 Monstros iniciais aleatórios; insígnias de origem inicial, comprado e evento/campanha). Valores e regras propostos em `PROGRESSAO.md` (Q-P1 a Q-P9) | Proprietário |
| D-46 | **Respostas de 15/11/2026 à análise de 37 itens.** Git local criado e autorizado (remoto privado no GitHub pendente: `gh` não instalado). **Fase A (beta jogável) autorizada para já**; Fases B (site vitrine) e C (progressão, loja, afiliados) confirmadas. Prioridade: mecânicas antes da estética do app (o app segue a estética do site). Beta: só o app, APK, 4 colegas (resolve PT-07). Sem domínio por enquanto; preferir opções gratuitas. Cloudflare e Sentry aprovados | Proprietário |
| D-47 | **Conta:** cadastro com e-mail e **senha**; código por e-mail **só para confirmar o cadastro**; login com senha no site e no app, com "manter conectado". **Substitui D-24 e resolve PT-12.** O envio do código reaproveita, só como inspiração, o sistema do projeto "aula no ouvido" (D-22 continua valendo) | Proprietário |
| D-48 | **Idade:** classificação **16+** com aviso ("pode ser perturbador; não recomendado para menores de 18; menores precisam de autorização dos pais ou responsáveis; participação por livre e espontânea vontade"). Cadastro pergunta se é maior de 18. **Menores nunca participam de eventos com prêmio em dinheiro.** Avisos no cadastro e nas políticas do site | Proprietário |
| D-49 | **Revólver (resolve L-02 a L-05):** quem pega gera no chat "*fulano pegou o revólver*"; todos os jogadores vivos veem "permitir disparo" e **uma** permissão libera o botão de disparo do portador; depois do disparo ele mantém a arma (novo disparo exige nova permissão) ou larga; 2 balas. A arma não pode ser tomada nem passada: só largada e pega de novo. O **Monstro pode pegar, nunca dispara, mesmo com permissão, e a interface não revela isso** (pode fingir medo). Balas acabadas não encerram a partida (contínua, D-51); restando só o Monstro e o portador, o Monstro vence (condição 2) | Proprietário |
| D-50 | **Abandono (L-06, PGD-12):** ficar fora do chat por **mais de 1 minuto** ou deslogar = abandono, que conta como morte. Monstro abandona → Inocentes vencem (D-31). Inocente abandona → conta a favor do Monstro (entra nas condições 2 e 3). *Interpretação a confirmar: a ausência de 1 min inclui queda de conexão, o que altera D-29* | Proprietário |
| D-51 | **Partida contínua, sem fases e sem limite de tempo** (L-10) | Proprietário |
| D-52 | **Monstros:** no beta os **10** entram; o jogador sorteado como Monstro escolhe qual dos 10 usar, e ninguém sabe quem foi sorteado (L-07). Versão definitiva: todo novo usuário recebe **3 Monstros mais simples** (dão menos XP); os outros por nível ou compra. Equilíbrio será medido nos testes | Proprietário |
| D-53 | **Jornal VHS (L-08, PGD-08):** um vídeo entre **3 e 9 min** de partida, com pista só sobre o **tipo** de Monstro. Vídeos feitos pelo proprietário, um por condição | Proprietário |
| D-54 | **Menu do Monstro (PGD-03):** menu abre/fecha no chat com **isca**, **infectar** e **infectar a si mesmo**. Infecção é permanente. A auto-infecção não conta para vitória | Proprietário |
| D-55 | **Espectadores (PGD-04/05):** eliminados podem assistir **só ao chat público**, nunca PVs. Menu do usuário "seja um espectador" lista partidas abertas para assistir (só chat público) | Proprietário |
| D-56 | **Mensagens (PGD-07):** não podem ser editadas nem apagadas; **áudio pode ser enviado** (altera D-19; regras do GDD §6 ainda valem). Mensagens ocasionais da **"Defesa Civil"** da cidade com imagem macabra, de um catálogo por tipo de Monstro | Proprietário |
| D-57 | **Fim de partida e pontuação (PGD-12, Q-P4):** vitória do Monstro mostra o avatar com animação (skins de animação de vitória à venda) e uma frase macabra do Monstro, sorteada de um arquivo com variações. As skins de todos aparecem. Cada ação na partida (mensagens, pegar a arma, abrir PV, votar etc.) vale pontos; o maior pontuador ganha mais XP; quem fica no topo com frequência ganha títulos de ranking ("os melhores investigadores", "matador de monstros"). XP e nível servem só para matchmaking por nível e acesso a eventos | Proprietário |
| D-58 | **Prólogo:** vídeo obrigatório para todo novo usuário, depois pulável; trocável por campanha (Dia das Bruxas, Natal Sombrio etc.) | Proprietário |
| D-59 | **Infecção:** Q-01 a Q-10 aprovadas como recomendadas em `INFECCAO.md` §6. IA mínima, simples e gratuita (de preferência de código aberto), só para revisão semântica; cada decisão fica registrada com o **número da partida e o motivo**; o painel do usuário terá **contestação** (número da partida + motivo). A IA só atua dentro do jogo; isso constará nos termos e na página de LGPD. Q-P1 a Q-P9 e PGD-13 aprovados por enquanto | Proprietário |
| D-60 | **Painéis:** administrador (acesso total; pode dar acesso administrativo a outras pessoas), afiliado (painel comum + link, total de compras pelo link, valor a receber, criar campanha, **pedir** cupom com desconto e quantidade; só o administrador cria cupons) e usuário comum | Proprietário |
| D-61 | **Loja e dinheiro:** vendas **só no site**; o app serve só para jogar e recebe as compras na conta (resolve a parte Google Play de PT-09). PIX e criptomoedas, com o sistema de "aula no ouvido" como inspiração. Novo usuário recebe personagem básico e algumas skins grátis; o personagem aparece nos rankings e nas vitórias. Rankings: dados fictícios por enquanto, depois contadores configuráveis pelo administrador. Questões fiscais adiadas até haver faturamento; painel do administrador simples (vendas e quanto pagar a cada afiliado). Textos dos Monstros no site podem ser atualizados (CF-08) | Proprietário |
| D-62 | **Áudio do site:** pelo menos **7** faixas de suspense, trocadas aleatoriamente em tempos aleatórios; o proprietário enviará arquivos livres de licença | Proprietário |

## Rejeitadas

| ID | Opção rejeitada | Motivo | Data |
|---|---|---|---|
| R-01 | Engine de jogos 3D | Jogo sem mapa nem movimentação (D-17) | 12/11/2026 |

## Hipóteses técnicas

H-01 a H-05 (React, TypeScript, Supabase, PostgreSQL, Cloudflare): **encerradas pela D-20**. Vercel: D-23.
Alternativas avaliadas e não adotadas: Colyseus + Fly.io, Nakama, Supabase ou Firebase sozinhos.

## Pendências técnicas

| ID | Pendência | Responsável |
|---|---|---|
| ~~PT-01 a PT-05~~ | App, backend, banco, hospedagem, tempo real → **resolvidas pela D-20** | — |
| PT-06 | Tecnologia de voz — **adiada** (voz fora do beta, D-19) | Agente 3 → proprietário, após o beta |
| PT-07 | Distribuição do app Android no beta | Agentes 3 e 4 → proprietário |
| ~~PT-08~~ | Método de login → **resolvida pela D-24** | — |
| PT-10 | Criar os recursos na nuvem (projetos Supabase e Workers de staging e produção) — **exige credenciais, autorização e possível custo** | Proprietário |
| PT-09 | Arquitetura de pagamentos | Agentes 3 e 5 → proprietário |
| PT-12 | **Conta no site:** o pedido cita cadastro com senha e recuperação de senha, mas o login aprovado é por código por e-mail, sem senha (D-24). O site usa o fluxo D-24 (só demonstração até o Supabase existir). Manter D-24 no site ou aprovar senha também? | Proprietário |
| ~~PT-13~~ | → **resolvida pela D-39**. Era: **Venda de Monstros e Guias:** vender Monstros pode dar vantagem competitiva (D-13, sem pay-to-win), e a liberação de Monstros no jogo ainda está aberta (L-07). Guias são só informativos. Precisa de decisão de economia | Agente 5 → proprietário |
| PT-14 | Termos de uso e Política de privacidade: textos provisórios no site; exigem redação e revisão jurídica | Proprietário |
| ~~PT-11~~ | Origem e licença do áudio → **resolvida pela D-33** | — |

## Pendências de game design (não inventar respostas)

| ID | Pendência |
|---|---|
| PGD-01 | Validação de negação, ironia, citação e variações nas expressões de infecção |
| PGD-02 | Frases exatas ou equivalência semântica |
| PGD-03 | Funcionamento detalhado da simulação de auto-infecção |
| PGD-04 | Comunicação entre jogadores eliminados |
| PGD-05 | Isolamento dos espectadores |
| PGD-06 | Compartilhamento e proteção de capturas de tela |
| PGD-07 | Possibilidade de edição de mensagens |
| PGD-08 | Frequência das transmissões VHS |
| ~~PGD-09~~ | ~~Inclusão da voz no primeiro beta~~ → **resolvida por D-19** (fora do beta) |
| PGD-10 | Expiração das autorizações de voz — **adiada** (voz fora do beta) |
| PGD-11 | Fórmulas de XP, rating e desempenho — **proposta v1 em `PROGRESSAO.md` §4 e §6, aguarda aprovação (Q-P7, Q-P8)** |
| PGD-13 | Critérios dos 5 rankings do site (proposta em `apps/web/public/js/portal.js`, `RANKING_CATS`): Melhor Monstro = taxa de vitória como Monstro; Melhor Detetive = +3 disparo que eliminou o Monstro, +1 autorização desse disparo, −2 disparo que eliminou Inocente; Monstros identificados e eliminados = total de eliminações do Monstro feitas pelo jogador; Inocente = taxa de vitória como Inocente; Desempenho como Monstro = infecções válidas por partida. Mínimo de 5 partidas. **Aguarda aprovação** (ligada à PGD-11) |
| PGD-14 | **Design v1 dos 10 Monstros** (origem e aparência já aprovadas: D-40) (textos publicados nas fichas do site por autorização do proprietário; a detecção no servidor ainda não foi implementada) (fichas, motor de detecção determinístico, bancos de expressões, conflitos C-01 a C-07) em `MONSTROS.md`. Resolve PGD-01/02 se aprovado. **Aguarda proprietário + revisão de equilíbrio do Agente 1** |
| PGD-15 | Bônus de XP para quem escolhe Monstro **aleatório** (citado pelo proprietário; valor e regra a definir com PGD-11) | 
| PGD-12 | Desconexão, abandono e reconexão. **Parcial:** D-29 (abandono × queda) e D-31 (Monstro abandona). Falta: efeito do abandono de um **Inocente** nas condições de vitória do Monstro, e o que é revelado no fim da partida |

## Lacunas encontradas na organização (aguardam o proprietário)

São perguntas que surgiram ao organizar as regras. **Não são propostas.**

| ID | Lacuna | Impacto |
|---|---|---|
| ~~L-01~~ | ~~Formato da partida~~ → **resolvida por D-17** (só chat e interface) | — |
| L-02 | Se as 2 balas acabarem sem matar o Monstro, os Inocentes perdem a única forma de vencer. Existe limite de tempo ou outro desfecho? | Fim de partida |
| L-03 | O Monstro pode **autorizar** disparos? Eliminados ou espectadores podem? | Regras do revólver |
| L-04 | Como o Monstro é impedido de disparar **sem revelar** a própria identidade na interface? | UX e segurança da informação |
| L-05 | O portador pode largar ou passar a arma? Ela pode ser tomada? | Regras do revólver |
| L-06 | Além do revólver, existe outra forma de um jogador morrer? (condição 3 do Monstro) | Condições de vitória |
| L-07 | Qual dos 10 Monstros é usado em cada partida, como é escolhido e quantos entram no beta? | Escopo do Agente 2 |
| L-08 | Jornal VHS: as pistas apontam para **jogadores** ou para o **tipo** de Monstro? | Regras do VHS |
| L-09 | Economia e progressão (Agente 5) entram no beta ou ficam para depois? | Escopo do beta |
| L-10 | A partida tem fases ou turnos, ou é contínua? | Modelo de estados e temporizadores no servidor |
| ~~L-11~~ | ~~Responsável pelo áudio~~ → **resolvida pela D-34** | — |

## Conflitos

Nenhum conflito encontrado entre as instruções recebidas até agora. Os sete prompts originais completos ainda não foram
anexados: os documentos em `agents/` usam o resumo aprovado de cada um.
