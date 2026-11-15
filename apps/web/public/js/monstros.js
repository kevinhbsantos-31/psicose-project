// Fichas dos Monstros (fonte: docs/MONSTROS.md, design v1, publicado no site com autorização do proprietário).
// Chave = id do Monstro. Campos ausentes continuam "A definir" no site.
export const MONSTER_TEXTS = {
  1: {
    description: "O moderador sensato. Resume as discussões, organiza votos e transforma conversas confusas em \"conclusões\". Nunca é o primeiro a acusar, mas sempre é o primeiro a fechar o raciocínio.",
    behavior: "Faz o grupo concordar com pequenas coisas até concordar com ele por reflexo. Começa com afirmações inofensivas e verdadeiras e, aos poucos, conduz o grupo para onde quer. Sob suspeita, pede para recapitular o que todos já concordaram. Em conflitos, propõe um meio-termo e pede confirmação.",
    ability: "Frase do Monstro: \"Então estamos de acordo, certo?\"\nArmadilha: recapitula um fato real no chat e pergunta ao alvo \"foi isso mesmo?\". A afirmação nem precisa ser falsa: a armadilha é a confirmação.",
    variations: "\"Eu confirmo\", \"foi isso mesmo\", \"isso mesmo\", \"você tem razão\", \"concordo com você\", \"faz sentido o que você disse\", \"exatamente isso\". Só vale como resposta direta ao Monstro. \"Sim\" ou \"ok\" sozinhos não contam.",
    limitations: "Precisa que a vítima responda logo depois dele: se alguém falar no meio, a armadilha se quebra. Um grupo que discorda por hábito o neutraliza.\nComo identificar: alguém que sempre resume a conversa e termina frases com \"certo?\" ou \"né?\". Os resumos dele têm pequenas distorções.\nComo evitar: não confirme na hora o que acabaram de dizer. Responda com o que você mesmo viu.",
    threat: "4 de 5. Concordar é comum e parece inofensivo, mas ele precisa de uma pergunta e de uma resposta imediata.",
  },
  2: {
    description: "O cético briguento. Corrige os outros, aponta contradições (às vezes inventadas) e não larga uma discussão.",
    behavior: "Atribui à vítima algo que ela não disse ou não fez, para provocar uma negação enfática. Sob suspeita, diz que estão distorcendo e cita mensagens fora de contexto. Em conflitos, entra para aumentar a briga.",
    ability: "Frase do Monstro: \"Você mesmo disse isso, está no chat.\"\nArmadilha: \"Você disse agora há pouco que ia autorizar o tiro no Y.\" A vítima, irritada, responde negando.",
    variations: "\"Isso não aconteceu\", \"eu não disse isso\", \"eu nunca disse isso\", \"eu não fiz isso\", \"isso é mentira\", \"para de inventar\", \"isso não é verdade\". Só vale como resposta direta ao Monstro.",
    limitations: "Precisa provocar e ficar exposto. Responder apontando a mensagem, em vez de negar, quebra a armadilha.\nComo identificar: atribui falas aos outros com frequência. O histórico, que não pode ser apagado, desmente.\nComo evitar: quando distorcerem o que você disse, mostre a mensagem em vez de negar.",
    threat: "3 de 5. Negar é instintivo, mas o comportamento dele é chamativo e o histórico vira prova contra ele.",
  },
  3: {
    description: "O observador frio. Fala pouco e, quando fala, faz perguntas curtas e invasivas. Quase nunca dá opinião.",
    behavior: "Interroga. Faz perguntas pessoais ou incriminatórias em sequência, até a vítima se recusar a continuar. Sob suspeita, devolve com outra pergunta. Escolhe quem já está na defensiva.",
    ability: "Frase do Monstro: \"É uma pergunta simples.\"\nArmadilha: enquanto o alvo é acusado por outro jogador, pergunta \"por que você estava no PV com o Y?\" e depois \"o que vocês combinaram?\".",
    variations: "\"Não vou responder\", \"não vou falar sobre isso\", \"não tenho que responder\", \"não te devo explicação\", \"prefiro não responder\", \"sem comentários\", \"isso não te interessa\". Só vale como resposta direta ao Monstro.",
    limitations: "Só pergunta: não consegue forçar ninguém a responder. Uma resposta qualquer, mesmo evasiva, o neutraliza. Perguntar demais o deixa suspeito.\nComo identificar: quase não opina, mas faz muitas perguntas dirigidas, a um jogador por vez.\nComo evitar: responda o mínimo ou mude de assunto, em vez de se recusar. Ficar em silêncio também é seguro.",
    threat: "2 de 5. A recusa só aparece sob pressão forte, e o interrogatório chama atenção.",
  },
  4: {
    description: "O amigo de todos. Prestativo e conciliador, evita confrontos e propõe trabalho em equipe.",
    behavior: "Mostra competência e disponibilidade até virar a pessoa a quem todos pedem ajuda. Oferece análises e organiza o plano. Sob suspeita, se mostra magoado e ainda mais útil.",
    ability: "Frase do Monstro: \"Tudo bem, eu te ajudo.\"\nArmadilha: ajuda o alvo em público algumas vezes e depois oferece no PV: \"se precisar de mim, é só falar\".",
    variations: "\"Preciso da sua ajuda\", \"me ajuda\", \"me ajude\", \"pode me ajudar\", \"me dá uma ajuda\", \"me ajuda aqui\". O pedido precisa ser dirigido ao Monstro: no PV com ele, citando o codinome dele ou respondendo diretamente a ele.",
    limitations: "Oferecer ajuda não infecta ninguém. Ele precisa de tempo para conquistar confiança.\nComo identificar: prestativo demais, conquista a confiança de todos muito rápido e se oferece \"só para você\" no PV.\nComo evitar: peça ajuda ao grupo, não a uma pessoa. Desconfie do aliado perfeito.",
    threat: "3 de 5. Pedir ajuda é natural, mas a armadilha leva tempo.",
  },
  5: {
    description: "O investigador inflamado. Acelera o jogo, cobra posições e organiza rodadas de suspeitas.",
    behavior: "Transforma dúvida em acusação formal. Raramente acusa: faz os outros acusarem. Sob suspeita, aceita ser investigado e redireciona: \"então vamos todos dizer em quem votamos\". Age logo depois das pistas do VHS.",
    ability: "Frase do Monstro: \"Fala logo, de quem você desconfia?\"\nArmadilha: \"Chega de enrolação. Cada um fala de quem desconfia. Começa você.\"",
    variations: "\"Eu acuso [codinome]\", \"o monstro é o [codinome]\", \"[codinome] é o monstro\", \"meu voto é no [codinome]\", \"atira no [codinome]\". Só conta a acusação contra outro Inocente: acusar o próprio Monstro nunca infecta.",
    limitations: "Suspeitas (\"desconfio de…\") e acusações vagas não contam. Pressionar demais o expõe.\nComo identificar: exige acusações formais, impõe prazos e raramente se compromete com um nome.\nComo evitar: fale em suspeitas até ter certeza e não aceite a pressão por um veredito imediato.",
    threat: "4 de 5. Acusar faz parte do jogo, mas suspeitas não contam e acusar o Monstro certo é seguro.",
  },
  6: {
    description: "Discreto e acolhedor em público, caloroso e cúmplice no PV. Faz cada jogador sentir que é o único em quem ele confia.",
    behavior: "Troca segredos: primeiro conta um segredo falso ou banal, para criar reciprocidade, e depois espera a promessa de retribuição. Sob suspeita, diz que só fala no PV por medo de o Monstro ler.",
    ability: "Frase do Monstro: \"Isso fica só entre nós.\"\nArmadilha: no PV, \"vou te contar uma coisa que não falei para ninguém…\", seguido de \"e você, notou alguma coisa?\".",
    variations: "\"Vou te contar uma coisa\", \"vou te contar um segredo\", \"só pra você\", \"fica entre nós\", \"não conta pra ninguém\", \"vou te falar em segredo\". Só vale no PV com o Monstro.",
    limitations: "Funciona só no PV. Quem compartilha tudo em público fica imune.\nComo identificar: fala pouco em público, é muito ativo nos PVs e sabe coisas que ninguém disse no chat.\nComo evitar: leve para o público o que recebeu em segredo e não prometa exclusividade.",
    threat: "2 de 5. O gatilho é natural, mas a restrição ao PV limita muito.",
  },
  7: {
    description: "Carismático e espirituoso. Cria bordões, apelidos e frases de efeito que o grupo gosta de repetir.",
    behavior: "Planta uma frase marcante (a isca) e espera a vítima repeti-la, o que acontece naturalmente quando ela concorda, ironiza ou cita. Sob suspeita, faz piada.",
    ability: "Frase do Monstro: varia, porque é a própria isca. Bordão: \"Repete comigo.\"\nArmadilha: \"Quem pegar a arma primeiro é quem tem medo do monstro.\" A vítima responde \"quem pegar a arma primeiro é suspeito\".",
    variations: "Qualquer trecho com pelo menos 4 palavras seguidas, na mesma ordem, da isca do Monstro. Palavras fora de ordem, 3 palavras ou menos e citações entre aspas não contam.",
    limitations: "Precisa de uma isca marcante e de que a vítima a repita a tempo. A isca fica no histórico.\nComo identificar: solta frases prontas, às vezes estranhas, antes de silêncios.\nComo evitar: fale com as suas próprias palavras e não repita bordões.",
    threat: "3 de 5. Muito furtivo, mas exige preparo e é sensível ao tempo.",
  },
  8: {
    description: "O gêmeo social. Espelha o jeito de escrever, as opiniões e as suspeitas da vítima, e diz o que ela pensa antes dela.",
    behavior: "Constrói uma aliança por semelhança: \"pensamos igual, então somos um time\". Sob suspeita: \"se eu fosse o Monstro, você também seria, a gente pensou igual o tempo todo\". Escolhe quem se sente isolado.",
    ability: "Frase do Monstro: \"Você pensa exatamente como eu.\"\nArmadilha: copia as suspeitas do alvo em público, o defende e depois comenta no PV: \"desde o começo a gente desconfia das mesmas pessoas\".",
    variations: "\"A gente é igual\", \"somos parecidos\", \"sou igual a você\", \"penso igual a você\", \"penso como você\", \"a gente pensa igual\", \"você me entende\". Só vale como resposta direta ao Monstro ou no PV com ele.",
    limitations: "Precisa construir a semelhança ao longo da partida. Alianças baseadas em fatos o neutralizam.\nComo identificar: muda de opinião para combinar com a sua e copia seu jeito de escrever.\nComo evitar: forme alianças por evidências, não por afinidade.",
    threat: "2 de 5. A frase-gatilho é rara fora de uma aliança construída de propósito.",
  },
  9: {
    description: "Organizado, educado e cerimonioso. Pede licença para tudo: entrar na conversa, no PV, na aliança, no plano.",
    behavior: "Faz pedidos de permissão inofensivos até conceder virar hábito. Explora a culpa de excluir alguém. Sob suspeita: \"eu só pedi para participar, vocês estão me excluindo\".",
    ability: "Frase do Monstro: \"Posso entrar?\"\nArmadilha: quando dois jogadores formam uma aliança, pede \"posso entrar no grupo de vocês? Prometo ajudar\".",
    variations: "\"Pode vir\", \"entra aí\", \"pode entrar sim\", \"tá liberado\", \"pode participar\", \"fica à vontade\", \"seja bem-vindo\". Só vale como resposta direta ao Monstro ou no PV com ele.",
    limitations: "Precisa de algo em que se possa entrar: aliança, PV ou plano. Uma recusa educada o neutraliza.\nComo identificar: pede permissão o tempo todo e quer estar em todas as alianças.\nComo evitar: não autorize entradas. Mantenha a conversa aberta no chat público.",
    threat: "3 de 5. Pedidos de permissão são difíceis de recusar, mas o padrão é perceptível.",
  },
  10: {
    description: "Inquieto e sensível. Comenta detalhes estranhos e cria um clima de vigilância.",
    behavior: "Sugere presenças (\"alguém está lendo tudo\") até a vítima também relatar ter percebido algo. Sob suspeita: \"eu só estou dizendo o que eu vejo\". Age logo depois do Jornal VHS ou de uma morte.",
    ability: "Frase do Monstro: \"Você também está vendo?\"\nArmadilha: depois de uma transmissão do VHS, \"tenho a sensação de que tem alguém olhando… você sentiu também?\".",
    variations: "\"Eu vi alguém\", \"vi uma figura\", \"vi um vulto\", \"senti uma presença\", \"tem alguém aqui\", \"tem alguém olhando\", \"tem alguém me observando\". \"Tem alguém aqui mentindo\" não conta.",
    limitations: "O gatilho não surge numa conversa normal sem que ele crie o clima, e isso o deixa estranho.\nComo identificar: fala de presenças e sensações em vez de fatos.\nComo evitar: não relate percepções sobre presenças. Fale só do que está no chat.",
    threat: "2 de 5. Muito assustador, mas a condição é rara e o comportamento que a provoca é visível.",
  },
};

// Advertência aprovada pelo proprietário: fecha a aparência de cada ficha e aparece no topo da página Monstros.
export const MONSTER_WARNING = "O que você vê nem sempre é o que está diante de você. Esta imagem mostra a manifestação verdadeira da criatura, reconstruída a partir dos relatos de sobreviventes. Mas elas sabem vestir a aparência humana e caminhar entre nós sem despertar suspeita: assumem rostos comuns, sorriem, ajudam, conquistam a sua confiança. Não confie em sorrisos amigáveis. Nem todo rosto humano pertence a um ser humano.";

// Origem e aparência (aprovadas; cidade de Itaverá, D-40). A aparência segue a arte oficial de cada card.
const LORE = {
  1: [
    "Antes de ter um nome nos arquivos, era Anselmo Prado, o mediador de disputas de terra de Itaverá. Diziam que nenhuma briga resistia a uma tarde com ele: ouvia os dois lados, dava razão aos dois e saía com as duas assinaturas. Com os anos, concordou com tanta gente, e com tantas versões opostas, que não restou nele nenhuma opinião própria.\n\nEm 1961 apareceu na assembleia de Vila Serena, sem ter sido convidado, e propôs que a vila \"concordasse em seguir em frente\" depois do sumiço de três crianças do bairro. A proposta foi aprovada por aclamação. A ata registra 212 assinaturas sob a frase \"de acordo\", mas o censo daquele ano contava 180 moradores. As 32 assinaturas restantes têm exatamente a mesma caligrafia, e ninguém se lembra das pessoas a quem pertencem. Cada \"sim\" dito a ele é mais uma assinatura nessa ata.",
    "Os sobreviventes o descrevem de terno escuro e camisa clara de colarinho, como um funcionário de cartório pronto para uma reunião. A cabeça é lisa, pálida e sem cabelo. O sorriso é largo demais: estica o rosto inteiro até quase as orelhas e nunca se desfaz. Os olhos são duas fendas escuras, apertadas pelo próprio sorriso, e ninguém consegue dizer para onde ele olha.\n\nA mão direita está sempre estendida, com a palma para cima e os dedos longos e abertos, como quem oferece um acordo. Quem descreveu essa mão diz que ela nunca se fecha num aperto: espera que você a aceite. O fundo, nos relatos, é sempre o mesmo: madeira escura de uma sala de reuniões antiga.",
  ],
  2: [
    "Foi escrivão do cartório de Itaverá nos anos 1930, encarregado de passar a limpo os registros danificados pela enchente de 1937. Percebeu que, onde a tinta tinha borrado, podia escrever o que quisesse, e começou a corrigir: datas, nomes, parentescos. Quando as famílias vinham reclamar, ele mostrava o livro e dizia: \"você mesmo assinou isto\". Elas negavam com tanta força que, com o tempo, já não sabiam o que estavam negando.\n\nO diário que ele deixou dentro da parede da paróquia de São Bento termina em 1939. No livro de batismos daquele ano, a mesma criança está registrada duas vezes, com nomes e pais diferentes, e cada família jura até hoje que a outra nunca existiu.",
    "O rosto é longo e estreito, coberto de rachaduras verticais profundas, como papel velho que secou e se partiu, ou como a capa de um livro de registros encharcada e depois esquecida. A boca não é uma boca: é um rasgo escuro e vertical que desce pelo rosto, aberto como se estivesse no meio de uma objeção.\n\nO corpo veste trapos da mesma cor gasta da pele, e é difícil dizer onde termina um e começa a outra. O gesto que todos os sobreviventes lembram é o dedo indicador ossudo apontado para a frente, direto para quem o observa, como quem diz \"foi você\".",
  ],
  3: [
    "Em 1951, um homem foi detido na delegacia de Itaverá por causa do desaparecimento de um carteiro. Não disse uma única palavra em 41 dias de interrogatório: nem o nome, nem a idade, nem um pedido de água. No 42º dia, quando abriram a cela, o rosto dele estava liso, sem boca. Os registros dizem que foi solto por falta de provas e que ninguém o viu sair.\n\nAnos depois, apareceram as fitas dos interrogatórios seguintes. Na fita nº 7, ouve-se o interrogado respondendo, hesitando e, por fim, se recusando a falar. A voz do interrogador, porém, nunca foi gravada: no lugar das perguntas há apenas trechos de silêncio, com a duração exata de uma pergunta curta.",
    "Não tem rosto. Onde deveriam estar olhos, nariz e boca há apenas uma superfície pálida e lisa, levemente borrada, como uma fotografia em que a pessoa se mexeu. Um único dedo, longo e fino, está sempre pressionado na vertical sobre o lugar onde estaria a boca, no gesto universal de silêncio.\n\nO tronco é nu e magro, com clavículas e costelas marcadas sob a pele. Ele está sempre envolto numa escuridão quase total, como se a própria luz evitasse fazer perguntas. Os relatos dizem que nunca se ouviu sua respiração.",
  ],
  4: [
    "Elias V. foi voluntário da Santa Casa de Itaverá durante o surto de febre de 1953. Era o primeiro a chegar e o último a sair: trocava curativos, escrevia cartas para os doentes, segurava mãos. Em 1954 terminou de escrever à mão \"Ajuda Aqui — A Arte de Ser Necessário\".\n\nOs prontuários daquele ano têm uma anotação curiosa: em todos os pacientes que \"pediram ajuda a Elias\" consta \"alta\", mas nenhum deles voltou para casa. As primeiras páginas do manuscrito estão na letra dele. As últimas estão em caligrafias diferentes, e as famílias que as viram reconheceram a letra dos parentes desaparecidos.",
    "Uma figura curvada, enrolada em panos rasgados que lembram um cobertor de enfermaria ou uma manta de pedinte. A cabeça pende para a frente. Os olhos são duas cavidades escuras e a boca é um buraco aberto, como num gemido que nunca termina.\n\nO braço é longo demais para o corpo e se estende em direção a quem o vê, com a palma da mão para cima. É a imagem mais cruel do arquivo: parece uma criatura pedindo ajuda, mas a mão está oferecendo. É ela que espera você pedir.",
  ],
  5: [
    "Foi contramestre da Tecelagem Santa Luzia, a maior fábrica de Itaverá. Em 1972, durante uma greve, os donos lhe pediram \"nomes\", e ele inventou algo melhor: as reuniões de denúncia, em que cada operário dizia de quem desconfiava. Ele mesmo nunca apontou ninguém. Em quatro meses, cada funcionário tinha acusado outro, e todos os acusados sumiram da folha de pagamento.\n\nA Comissão de Inquérito que investigou o caso descobriu que o contramestre também não constava em nenhuma folha, de nenhum ano. O relatório final da comissão nunca foi publicado. Cada página acusa um dos membros da própria comissão e está assinada pelo membro acusado na página anterior.",
    "É alto e esquelético, com a pele cinzenta e enrugada colada aos ossos. A cabeça é alongada como um crânio, com olhos fundos e escuros e a boca escancarada num grito sem som.\n\nO que domina a imagem é o braço: longo e fino como um galho seco, esticado até o limite e terminando num indicador que aponta para fora do quadro, para alguém que você não vê. Os sobreviventes não concordam sobre o tamanho desse braço. Alguns relatos dizem que ele é um pouco mais longo cada vez que é visto.",
  ],
  6: [
    "No inverno de 1949, uma tempestade derrubou as linhas e isolou Itaverá por seis semanas. A única pessoa que ainda tinha contato com todas as casas era quem trabalhava na central telefônica, alguém que, por anos, tinha ouvido em silêncio todas as conversas da cidade.\n\nDurante o isolamento, essa pessoa começou a enviar cartas. Cada uma começava com \"Você é o único a quem posso contar isto\" e revelava um segredo do próprio destinatário, algo que ele nunca tinha contado a ninguém. Todas terminavam do mesmo jeito: \"Agora me conte o seu.\" As respostas foram encontradas anos depois, numa gaveta da central, empilhadas e ainda lacradas, porque nunca precisaram ser abertas.",
    "É a única imagem do arquivo em que aparece uma pessoa comum, vista de costas, com cabelo curto e despreocupada. Atrás dela, inclinada sobre o seu ombro, está a criatura: imensa, pálida, com a pele flácida e enrugada. A cabeça é tão grande que ocupa metade da cena e tem os traços borrados.\n\nEla leva uma das mãos, de dedos longos e finos, em concha até a boca, no gesto íntimo de quem conta um segredo ao ouvido. A pessoa não percebe nada. Segundo os relatos, é sempre assim: o Confidente nunca está diante de você, está logo atrás.",
  ],
  7: [
    "No século XIX, as crianças de Itaverá cantavam uma canção de roda que terminava com todos repetindo o último verso juntos. Numa festa de São João, um menino do coro se perdeu na velha pedreira ao norte da cidade, onde o eco é tão forte que devolve frases inteiras. Procuraram por ele durante dias e só ouviram a voz dele repetindo as palavras de quem o chamava.\n\nO corpo nunca foi encontrado, mas o eco desceu da pedreira e passou a morar nas conversas da cidade. Gravações da festa de 1957 registram uma quinta voz no meio das outras quatro: ela repete as frases de todos com um pequeno atraso e, a cada repetição, soa um pouco mais parecida com a voz de quem falou.",
    "Não é uma figura, são várias. O que se vê é a mesma cabeça pálida e calva repetida em perfil, quatro ou cinco vezes, uma atrás da outra, como um rastro de movimento ou uma fotografia de longa exposição. Cada cópia está um pouco mais desfocada e distante que a anterior, até se dissolver no escuro.\n\nEm todas, a boca está escancarada no mesmo grito, ou no mesmo canto: ninguém sabe dizer qual. Os sobreviventes contam que, ao olhar para a imagem, têm a impressão de ouvir a última palavra que acabaram de dizer.",
  ],
  8: [
    "O diário foi encontrado num casarão fechado da Rua das Flores, escrito inteiro em letra espelhada. O autor vivia sozinho com um grande espelho oval herdado da família e, segundo as primeiras páginas, conversava com o próprio reflexo para não enlouquecer de solidão. Com os anos, as anotações mostram o reflexo concordando com ele cada vez mais rápido, terminando as frases dele e antecipando os seus medos, até a página em que o reflexo escreve: \"somos iguais\".\n\nDepois disso, o autor descreve as visitas que recebia, cada uma em detalhes íntimos. Os vizinhos que entraram na casa depois dessa data passaram a escrever, sem perceber, com as letras ao contrário. Hoje o espelho mostra alguém de pé no quarto, mesmo quando o quarto está vazio.",
    "A criatura aparece de costas, diante de um espelho oval de moldura antiga e ornamentada. É magra, pálida e calva, com os ombros estreitos curvados para a frente, como quem se aproxima para se ver melhor.\n\nO perturbador está no espelho: a figura refletida não corresponde a quem está diante dele. O reflexo encara quem observa a cena, enevoado, com olhos escuros e traços indefinidos, como se pertencesse a outra pessoa, ou como se estivesse esperando para ser outra pessoa. Os relatos não concordam sobre quem é o original e quem é o reflexo.",
  ],
  9: [
    "O dono da Pensão Aurora era famoso por nunca recusar um hóspede: viajantes sem dinheiro, doentes, fugitivos, todos tinham quarto. Num velho costume da região, certas coisas só entram numa casa se forem convidadas, e ele ria disso. Numa noite de 1966, alguém bateu à porta e perguntou, com muita educação: \"posso entrar?\". Ele disse que sim.\n\nA partir dessa data, o livro de hóspedes ganhou uma coluna sem título, com a palavra \"autorizado\" em cada linha, escrita sempre pela mesma mão, que não era a dele. A última entrada, de 1967, traz o nome do próprio dono, o quarto marcado como \"nenhum\" e, na coluna sem título, \"autorizado\". Desde então, é o Anfitrião quem pede para entrar.",
    "Ele aparece no vão de uma porta de madeira velha, entreaberta, com a escuridão às costas. É alto e veste um manto ou casaco escuro que se confunde com a sombra do corredor. A cabeça é pálida e alongada, com olhos que são só manchas escuras, e mal se distingue do escuro ao redor.\n\nSó a mão sai para a luz: longa, branca, com dedos finos, estendida para fora da porta e com a palma voltada para cima, no gesto educado de quem convida ou pede licença. Nos relatos, ele nunca atravessa a soleira primeiro. Espera.",
  ],
  10: [
    "Em 1957, o faroleiro de Ponta Escura, na costa de Itaverá, perdeu a esposa num naufrágio. Dias depois, jurou tê-la visto de pé nas pedras, durante a madrugada. Os outros homens do farol não viram nada, mas ele passou a vigiar todas as noites e a anotar cada sombra no livro de registros.\n\nAos poucos, os outros começaram a ver também: um vulto na escada, alguém na janela, uma presença na sala do lampião. Cada um assinava o próprio avistamento. O último registro diz: \"Eu também vi. Todos vimos. Só não sabemos o quê.\" O livro de serviço lista quatro homens na guarnição do farol, mas as assinaturas dos avistamentos são de cinco pessoas diferentes.",
    "É o mais difícil de ver, e é justamente esse o ponto. A imagem mostra o batente de uma porta de madeira escura, arranhada e manchada pelo tempo. Quase toda a cena é escuridão. Na borda do batente, meio escondido, há um rosto pálido espiando, com olhos escuros, e o corpo se perde na sombra.\n\nOs sobreviventes nunca descrevem o Observador inteiro, só a parte que aparece pela fresta: um ombro, metade de um rosto, um olho. Todos concordam numa coisa: quando você o percebe, ele já estava olhando havia muito tempo.",
  ],
};
for (const [id, [origin, appearance]] of Object.entries(LORE))
  Object.assign(MONSTER_TEXTS[id], { origin, appearance: `${appearance}\n\n${MONSTER_WARNING}` });
